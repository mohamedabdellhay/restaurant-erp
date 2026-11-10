import prisma from "../db/client.js";

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected successfully");
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
