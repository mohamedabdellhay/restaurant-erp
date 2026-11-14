import "dotenv/config";
import prisma from "../db/client.js";
import { ensurePlatformOwner } from "../modules/admin/ensureOwner.js";

export async function seedAdmin() {
  const before = await prisma.staff.findFirst({
    where: { isPlatformOwner: true },
    select: { id: true, email: true },
  });

  const owner = await ensurePlatformOwner();
  if (!owner) {
    throw new Error("Platform admin was not created. The owner email already belongs to a restaurant account.");
  }

  if (before) {
    console.log(`Platform admin already exists: ${owner.email}`);
  } else {
    console.log(`Platform admin ready: ${owner.email}`);
  }

  return owner;
}

if (process.argv[1]?.endsWith("admin.seeder.js")) {
  seedAdmin()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error("Admin seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
