import "dotenv/config";
import prisma from "../db/client.js";
import { seedAdmin } from "./admin.seeder.js";
import { seedDemoData } from "./demoData.seeder.js";

async function seedAccounts() {
  await seedAdmin();
  await seedDemoData();
  console.log("Admin, subscriber, menu, inventory, and orders are ready.");
}

seedAccounts()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Account seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
