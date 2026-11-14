import "dotenv/config";
import prisma from "../db/client.js";

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
      users: 2, // Example limit
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

export async function upsertPlans() {
  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { name: planData.name },
      update: {
        price: planData.price,
        features: planData.features,
        limits: planData.limits,
        description: planData.description,
      },
      create: planData,
    });
    console.log(`Upserted Plan: ${planData.name}`);
  }
}

const seedPlans = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL...");
    await upsertPlans();
    console.log("Plans seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith("seedPlans.js")) {
  seedPlans();
}
