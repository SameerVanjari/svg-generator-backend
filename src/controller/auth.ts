import { Request, Response } from "express";
import { prisma } from "../server";
import bcrypt from "bcrypt";
import { generateToken } from "../middlewares/auth";
import { createUser, getUser, getUserById } from "../service";

// Auth
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const existing = await getUser(email);
  if (existing) return res.status(400).json({ error: "User already exists" });

  const user = await createUser(email, password, name);

  console.log("user created:", user);

  res.status(201).json({ message: "User registered" });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getUser(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user as any);

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax",
    })
    .json({ message: "Logged in successfully", data: { user } });
};

// 🚪 Logout
export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("token").json({ message: "Logged out" });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

export const getAdmin = async (req: Request, res: Response) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  res.json({ message: "Welcome admin!" });
};
