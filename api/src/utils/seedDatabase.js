import "dotenv/config";
import prisma from "../db/client.js";
import { hashPassword } from "../db/password.js";
import RoleService from "../services/RoleService.js";
import DepartmentService from "../services/DepartmentService.js";

// Plans data
const plans = [
  {
    name: "Basic",
    price: 1500,
    features: [
      "pos",
      "order_management",
      "bill_printing",
      "product_management",
      "simple_reports",
    ],
    limits: {
      users: 2,
      branches: 1,
    },
    description: "For small restaurants.",
  },
  {
    name: "Standard",
    price: 3000,
    features: [
      "pos",
      "order_management",
      "bill_printing",
      "product_management",
      "simple_reports",
      "inventory",
      "table_management",
      "staff_management",
      "advanced_reports",
      "user_roles",
    ],
    limits: {
      users: 5,
      branches: 1,
    },
    description: "For medium restaurants.",
  },
  {
    name: "Premium",
    price: 6000,
    features: [
      "pos",
      "order_management",
      "bill_printing",
      "product_management",
      "simple_reports",
      "inventory",
      "table_management",
      "staff_management",
      "advanced_reports",
      "user_roles",
      "multi_branch",
      "dashboard",
      "api_integration",
      "loyalty_system",
      "fast_support",
    ],
    limits: {
      users: 999,
      branches: 999,
    },
    description: "For large restaurants or chains.",
  },
];

// Restaurant data
const restaurantData = {
  name: "The Golden Fork",
  address: "123 Main Street, Cairo, Egypt",
  phone: "+20 123 456 7890",
  email: "info@goldenfork.com",
  website: "https://goldenfork.com",
  currency: "EGP",
  settings: {
    taxPercent: 14,
    serviceChargePercent: 12,
    theme: {
      primaryColor: "#D4AF37",
      secondaryColor: "#1a1a1a",
      accentColor: "#ff6b6b",
      mode: "light",
    },
  },
  openingHours: {
    monday: "10:00 AM - 11:00 PM",
    tuesday: "10:00 AM - 11:00 PM",
    wednesday: "10:00 AM - 11:00 PM",
    thursday: "10:00 AM - 11:00 PM",
    friday: "10:00 AM - 12:00 AM",
    saturday: "10:00 AM - 12:00 AM",
    sunday: "10:00 AM - 11:00 PM",
  },
  socialMedia: {
    facebook: "https://facebook.com/goldenfork",
    instagram: "https://instagram.com/goldenfork",
    twitter: "https://twitter.com/goldenfork",
  },
  vatNumber: "123456789",
  crNumber: "987654321",
};

// Categories data
const categoriesData = [
  {
    name: "Appetizers",
    description: "Start your meal with our delicious appetizers",
    isActive: true,
  },
  {
    name: "Main Courses",
    description: "Hearty and satisfying main dishes",
    isActive: true,
  },
  {
    name: "Desserts",
    description: "Sweet treats to end your meal",
    isActive: true,
  },
  {
    name: "Beverages",
    description: "Refreshing drinks and beverages",
    isActive: true,
  },
  {
    name: "Salads",
    description: "Fresh and healthy salad options",
    isActive: true,
  },
];

// Menu items data (will be populated with category references)
const menuItemsData = [
  // Appetizers
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing and croutons",
    price: 45,
    categoryName: "Appetizers",
    isActive: true,
  },
  {
    name: "Garlic Bread",
    description: "Toasted bread with garlic butter and herbs",
    price: 25,
    categoryName: "Appetizers",
    isActive: true,
  },
  {
    name: "Chicken Wings",
    description: "Crispy chicken wings with your choice of sauce",
    price: 65,
    categoryName: "Appetizers",
    isActive: true,
  },
  // Main Courses
  {
    name: "Grilled Chicken",
    description: "Tender grilled chicken breast with vegetables",
    price: 120,
    categoryName: "Main Courses",
    isActive: true,
  },
  {
    name: "Beef Steak",
    description: "Premium beef steak cooked to perfection",
    price: 250,
    categoryName: "Main Courses",
    isActive: true,
  },
  {
    name: "Pasta Carbonara",
    description: "Creamy pasta with bacon and parmesan",
    price: 95,
    categoryName: "Main Courses",
    isActive: true,
  },
  {
    name: "Margherita Pizza",
    description: "Classic pizza with tomato, mozzarella, and basil",
    price: 85,
    categoryName: "Main Courses",
    isActive: true,
  },
  // Desserts
  {
    name: "Chocolate Cake",
    description: "Rich chocolate cake with chocolate frosting",
    price: 50,
    categoryName: "Desserts",
    isActive: true,
  },
  {
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee and mascarpone",
    price: 60,
    categoryName: "Desserts",
    isActive: true,
  },
  {
    name: "Ice Cream",
    description: "Three scoops of your favorite flavors",
    price: 35,
    categoryName: "Desserts",
    isActive: true,
  },
  // Beverages
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 30,
    categoryName: "Beverages",
    isActive: true,
  },
  {
    name: "Cappuccino",
    description: "Italian coffee with steamed milk",
    price: 25,
    categoryName: "Beverages",
    isActive: true,
  },
  {
    name: "Soft Drink",
    description: "Choice of cola, sprite, or fanta",
    price: 15,
    categoryName: "Beverages",
    isActive: true,
  },
  // Salads
  {
    name: "Greek Salad",
    description: "Fresh vegetables with feta cheese and olives",
    price: 55,
    categoryName: "Salads",
    isActive: true,
  },
  {
    name: "Garden Salad",
    description: "Mixed greens with fresh vegetables",
    price: 40,
    categoryName: "Salads",
    isActive: true,
  },
];

// Staff data
const staffData = [
  {
    name: "Admin User",
    email: "admin@goldenfork.com",
    password: "Admin@123",
    phone: "+20 100 000 0001",
    role: "admin",
    isActive: true,
  },
  {
    name: "John Manager",
    email: "manager@goldenfork.com",
    password: "Manager@123",
    phone: "+20 100 000 0002",
    role: "manager",
    isActive: true,
  },
  {
    name: "Sarah Cashier",
    email: "cashier@goldenfork.com",
    password: "Cashier@123",
    phone: "+20 100 000 0003",
    role: "cashier",
    isActive: true,
  },
  {
    name: "Mike Chef",
    email: "chef@goldenfork.com",
    password: "Chef@123",
    phone: "+20 100 000 0004",
    role: "chef",
    isActive: true,
  },
  {
    name: "Emma Waiter",
    email: "waiter@goldenfork.com",
    password: "Waiter@123",
    phone: "+20 100 000 0005",
    role: "waiter",
    isActive: true,
  },
];

// Tables data
const tablesData = [
  { number: 1, capacity: 2, location: "Main Hall", status: "available" },
  { number: 2, capacity: 4, location: "Main Hall", status: "available" },
  { number: 3, capacity: 4, location: "Main Hall", status: "available" },
  { number: 4, capacity: 6, location: "Main Hall", status: "available" },
  { number: 5, capacity: 2, location: "Terrace", status: "available" },
  { number: 6, capacity: 4, location: "Terrace", status: "available" },
  { number: 7, capacity: 8, location: "Private Room", status: "available" },
  { number: 8, capacity: 6, location: "Main Hall", status: "available" },
];

// Inventory items data
const inventoryItemsData = [
  {
    name: "Chicken Breast",
    unit: "kg",
    quantity: 50,
    minQuantity: 10,
    price: 80,
  },
  {
    name: "Beef",
    unit: "kg",
    quantity: 30,
    minQuantity: 5,
    price: 200,
  },
  {
    name: "Pasta",
    unit: "kg",
    quantity: 40,
    minQuantity: 10,
    price: 25,
  },
  {
    name: "Tomatoes",
    unit: "kg",
    quantity: 25,
    minQuantity: 5,
    price: 15,
  },
  {
    name: "Lettuce",
    unit: "kg",
    quantity: 20,
    minQuantity: 5,
    price: 20,
  },
  {
    name: "Mozzarella Cheese",
    unit: "kg",
    quantity: 15,
    minQuantity: 3,
    price: 120,
  },
  {
    name: "Olive Oil",
    unit: "liter",
    quantity: 10,
    minQuantity: 2,
    price: 150,
  },
  {
    name: "Coffee Beans",
    unit: "kg",
    quantity: 8,
    minQuantity: 2,
    price: 300,
  },
  {
    name: "Orange",
    unit: "kg",
    quantity: 30,
    minQuantity: 10,
    price: 20,
  },
  {
    name: "Chocolate",
    unit: "kg",
    quantity: 12,
    minQuantity: 3,
    price: 180,
  },
];

// Suppliers data
const suppliersData = [
  {
    name: "Fresh Produce Co.",
    contactPerson: "Ahmed Hassan",
    phone: "+20 100 111 1111",
    email: "contact@freshproduce.com",
    address: "456 Market Street, Cairo",
    category: "Vegetables & Fruits",
  },
  {
    name: "Premium Meats Ltd.",
    contactPerson: "Mohamed Ali",
    phone: "+20 100 222 2222",
    email: "sales@premiummeats.com",
    address: "789 Industrial Zone, Cairo",
    category: "Meat & Poultry",
  },
  {
    name: "Dairy Delights",
    contactPerson: "Sara Ibrahim",
    phone: "+20 100 333 3333",
    email: "info@dairydelights.com",
    address: "321 Dairy Road, Giza",
    category: "Dairy Products",
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("Connected to PostgreSQL\n");

    console.log("Clearing existing data...");
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.menuRecipeItem.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.supplierTransaction.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.role.deleteMany();
    await prisma.department.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.table.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.plan.deleteMany();
    console.log("Existing data cleared\n");

    console.log("Seeding Plans...");
    const createdPlans = [];
    for (const plan of plans) {
      createdPlans.push(await prisma.plan.create({ data: plan }));
    }
    console.log(`Created ${createdPlans.length} plans\n`);

    console.log("Seeding Restaurant...");
    const restaurant = await prisma.restaurant.create({ data: restaurantData });
    await RoleService.seedDefaultRoles(restaurant.id);
    await DepartmentService.seedDefaultDepartments(restaurant.id);
    const premium = createdPlans.find((plan) => plan.name === "Premium");
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    await prisma.subscription.create({
      data: {
        restaurantId: restaurant.id,
        planId: premium.id,
        endDate,
        status: "active",
      },
    });
    console.log(`Created restaurant: ${restaurant.name}\n`);

    console.log("Seeding Categories...");
    const createdCategories = [];
    for (const category of categoriesData) {
      createdCategories.push(
        await prisma.category.create({
          data: { ...category, restaurantId: restaurant.id },
        }),
      );
    }
    const categoryMap = Object.fromEntries(createdCategories.map((cat) => [cat.name, cat.id]));
    console.log(`Created ${createdCategories.length} categories\n`);

    console.log("Seeding Menu Items...");
    for (const item of menuItemsData) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          isActive: item.isActive,
          categoryId: categoryMap[item.categoryName],
          restaurantId: restaurant.id,
        },
      });
    }
    console.log(`Created ${menuItemsData.length} menu items\n`);

    console.log("Seeding Staff...");
    const roles = await prisma.role.findMany({ where: { restaurantId: restaurant.id } });
    for (const member of staffData) {
      const role = roles.find((entry) => entry.name.toLowerCase() === member.role.toLowerCase());
      await prisma.staff.create({
        data: {
          name: member.name,
          email: member.email,
          passwordHash: await hashPassword(member.password),
          phone: member.phone,
          roleId: role.id,
          isActive: member.isActive,
          restaurantId: restaurant.id,
        },
      });
    }
    console.log(`Created ${staffData.length} staff members\n`);

    console.log("Seeding Tables...");
    for (const table of tablesData) {
      await prisma.table.create({
        data: {
          number: String(table.number),
          seats: table.capacity || 2,
          status: table.status || "available",
          restaurantId: restaurant.id,
        },
      });
    }
    console.log(`Created ${tablesData.length} tables\n`);

    console.log("Seeding Suppliers...");
    const createdSuppliers = [];
    for (const supplier of suppliersData) {
      createdSuppliers.push(
        await prisma.supplier.create({
          data: {
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            address: { street: supplier.address },
            restaurantId: restaurant.id,
          },
        }),
      );
    }
    console.log(`Created ${createdSuppliers.length} suppliers\n`);

    console.log("Seeding Inventory Items...");
    for (const [index, item] of inventoryItemsData.entries()) {
      await prisma.inventoryItem.create({
        data: {
          name: item.name,
          unit: item.unit,
          stock: item.quantity,
          minStockAlert: item.minQuantity,
          costPrice: item.price,
          supplierId: createdSuppliers[index % createdSuppliers.length].id,
          restaurantId: restaurant.id,
        },
      });
    }
    console.log(`Created ${inventoryItemsData.length} inventory items\n`);

    console.log("Database seeding completed.");
    console.log("Default staff credentials:");
    staffData.forEach((member) => {
      console.log(`${member.role}: ${member.email} / ${member.password}`);
    });
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();

