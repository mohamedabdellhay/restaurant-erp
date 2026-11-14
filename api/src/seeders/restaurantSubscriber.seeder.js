import "dotenv/config";
import prisma from "../db/client.js";
import { hashPassword } from "../db/password.js";
import RoleService from "../modules/role/role.service.js";
import DepartmentService from "../modules/department/department.service.js";
import { upsertPlans } from "../utils/seedPlans.js";

const RESTAURANT_EMAIL = process.env.SUBSCRIBER_RESTAURANT_EMAIL || "info@goldenfork.com";
const RESTAURANT_NAME = process.env.SUBSCRIBER_RESTAURANT_NAME || "The Golden Fork";
const STAFF_EMAIL = process.env.SUBSCRIBER_EMAIL || "admin@goldenfork.com";
const STAFF_PASSWORD = process.env.SUBSCRIBER_PASSWORD || "Admin@123";
const STAFF_NAME = process.env.SUBSCRIBER_NAME || "Restaurant Admin";
const PLAN_NAME = process.env.SUBSCRIBER_PLAN || "Standard";

function addOneYear(date) {
  const end = new Date(date);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

export async function seedRestaurantSubscriber() {
  await upsertPlans();

  const plan = await prisma.plan.findFirst({
    where: { name: PLAN_NAME, isActive: true },
  });
  if (!plan) {
    throw new Error(`Plan "${PLAN_NAME}" was not found.`);
  }

  let restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ email: RESTAURANT_EMAIL }, { name: RESTAURANT_NAME }] },
  });
  let createdRestaurant = false;

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: RESTAURANT_NAME,
        address: "123 Main Street, Cairo, Egypt",
        phone: "+20 123 456 7890",
        email: RESTAURANT_EMAIL,
        currency: "EGP",
        vatNumber: "123456789",
        crNumber: "987654321",
        settings: {
          taxPercent: 14,
          serviceChargePercent: 12,
          theme: {
            primaryColor: "#0066cc",
            secondaryColor: "#004499",
            accentColor: "#00ccff",
            mode: "light",
          },
          paymentGateways: { kashier: { testMode: true } },
        },
      },
    });
    createdRestaurant = true;
    console.log(`Restaurant created: ${restaurant.name}`);
  } else {
    console.log(`Restaurant already exists: ${restaurant.name}`);
  }

  await RoleService.seedDefaultRoles(restaurant.id);
  await DepartmentService.seedDefaultDepartments(restaurant.id);

  const [adminRole, management] = await Promise.all([
    prisma.role.findFirst({ where: { restaurantId: restaurant.id, name: "Admin" } }),
    prisma.department.findFirst({ where: { restaurantId: restaurant.id, name: "Management" } }),
  ]);
  if (!adminRole) throw new Error("Admin role was not created for the restaurant.");

  const existingStaff = await prisma.staff.findUnique({ where: { email: STAFF_EMAIL } });
  let staff = existingStaff;

  if (existingStaff && existingStaff.restaurantId && existingStaff.restaurantId !== restaurant.id) {
    throw new Error(`${STAFF_EMAIL} already belongs to another restaurant.`);
  }
  if (existingStaff?.isPlatformOwner) {
    throw new Error(`${STAFF_EMAIL} is the platform admin. Use a different subscriber email.`);
  }

  if (!existingStaff) {
    staff = await prisma.staff.create({
      data: {
        name: STAFF_NAME,
        email: STAFF_EMAIL,
        passwordHash: await hashPassword(STAFF_PASSWORD),
        roleId: adminRole.id,
        departmentId: management?.id || null,
        restaurantId: restaurant.id,
        isActive: true,
      },
    });
    console.log(`Restaurant subscriber ready: ${staff.email}`);
  } else {
    const patch = {};
    if (!existingStaff.restaurantId) patch.restaurantId = restaurant.id;
    if (!existingStaff.roleId) patch.roleId = adminRole.id;
    if (!existingStaff.departmentId && management) patch.departmentId = management.id;
    if (!existingStaff.isActive) patch.isActive = true;
    if (Object.keys(patch).length) {
      staff = await prisma.staff.update({ where: { id: existingStaff.id }, data: patch });
    }
    console.log(`Restaurant subscriber already exists: ${staff.email}`);
  }

  const now = new Date();
  const active = await prisma.subscription.findFirst({
    where: {
      restaurantId: restaurant.id,
      status: "active",
      endDate: { gt: now },
    },
  });

  if (active) {
    console.log(`Active subscription already exists until ${active.endDate.toISOString().slice(0, 10)}.`);
  } else {
    const startDate = now;
    const subscription = await prisma.subscription.create({
      data: {
        restaurantId: restaurant.id,
        planId: plan.id,
        status: "active",
        startDate,
        endDate: addOneYear(startDate),
        autoRenew: true,
        paymentDetails: {
          paymentMethod: "seed",
          paidAt: startDate.toISOString(),
          amount: plan.price,
          currency: plan.currency,
        },
      },
    });
    console.log(
      `Subscription created: ${plan.name}, active until ${subscription.endDate.toISOString().slice(0, 10)}.`,
    );
  }

  return { restaurant, staff, createdRestaurant };
}

if (process.argv[1]?.endsWith("restaurantSubscriber.seeder.js")) {
  seedRestaurantSubscriber()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error("Restaurant subscriber seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
