import { Role } from "@prisma/client";
import prisma from "../helpers/prisma";

const admin = {
  password: "1234",
  name: "Sabbir Hossain Shanto",
  email: "sabbirshnt@gmail.com",
  role: Role.ADMIN,
};

const seedAdmin = async () => {
  const isAdminExist = await prisma.user.findFirst({
    where: {
      role: Role.ADMIN,
    },
  });

  if (!isAdminExist) {
    await prisma.user.create({
      data: admin,
    });
  }
};

export default seedAdmin;
