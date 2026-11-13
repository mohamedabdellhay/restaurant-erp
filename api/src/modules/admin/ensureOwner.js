import prisma from "../../db/client.js";
import { hashPassword } from "../../db/password.js";

const DEFAULT_EMAIL = "platform@goldenfork.com";
const DEFAULT_PASSWORD = "Platform@123";

export async function ensurePlatformOwner() {
  await prisma.platformSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const existing = await prisma.staff.findFirst({
    where: { isPlatformOwner: true },
  });
  if (existing) return existing;

  const email = process.env.PLATFORM_OWNER_EMAIL || DEFAULT_EMAIL;
  const taken = await prisma.staff.findUnique({ where: { email } });
  if (taken) {
    console.warn(
      `Platform owner was not created. ${email} already belongs to a restaurant account.`,
    );
    return null;
  }

  const password = process.env.PLATFORM_OWNER_PASSWORD || DEFAULT_PASSWORD;
  const owner = await prisma.staff.create({
    data: {
      name: "Platform Owner",
      email,
      passwordHash: await hashPassword(password),
      isPlatformOwner: true,
      isActive: true,
    },
  });

  console.log(`Platform owner created: ${email}`);
  return owner;
}
