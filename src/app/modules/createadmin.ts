import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.create({
      data: {
        id: "admin-id-123",
        name: "Suparna",
        email: "suparnad806@gmail.com",
        password: hashedPassword, 
        role: "ADMIN",
        isDeleted: false,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePhoto: null,
      },
    });

    console.log("Admin user created:", adminUser);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
