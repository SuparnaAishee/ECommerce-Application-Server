import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../helpers/prisma";

const DEMO_ADMIN_EMAIL = "admin@dokanxpress.dev";
const DEMO_ADMIN_PASSWORD = "password123";

const seedAdmin = async () => {
  const hashed = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  // Upsert keeps this idempotent even if an older seed created the row
  // with a plaintext password.
  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { password: hashed, role: Role.ADMIN },
    create: {
      email: DEMO_ADMIN_EMAIL,
      name: "Dokan Admin",
      password: hashed,
      role: Role.ADMIN,
    },
  });
};

export default seedAdmin;
