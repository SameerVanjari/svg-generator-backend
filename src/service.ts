import { prisma } from "./server";
import bcrypt from "bcrypt";

// auth
export const getUser = async (email: string) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
};

export const createUser = async (
  email: string,
  password: string,
  name: string
) => {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, password: hashed, name },
  });
};
