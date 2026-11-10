import "dotenv/config";
import prisma from "../db/client.js";

const verifySettings = async () => {
  try {
    await prisma.$connect();
    const restaurant = await prisma.restaurant.findFirst({ orderBy: { createdAt: "desc" } });
    if (!restaurant) {
      console.log("No restaurant found.");
      process.exit(0);
    }
    console.log(JSON.stringify(restaurant.settings, null, 2));
    await prisma.$disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verifySettings();
