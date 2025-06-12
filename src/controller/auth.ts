import { Request, Response } from "express";
import { prisma } from "../server";
import bcrypt from "bcrypt";
import { generateToken } from "../middlewares/auth";
import { createUser, getUser, getUserById } from "../service";

// Auth
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existing = await getUser(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
        data: null,
        error: "USER_EXISTS",
      });
    }

    const user = await createUser(email, password, name);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: { id: user.id, email: user.email, name: user.name } },
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      data: null,
      error: (err as Error).message,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await getUser(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const token = generateToken(user as any);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false, // set to true in production with HTTPS
        sameSite: "lax",
      })
      .cookie("user_id", user.id, {
        httpOnly: true,
        secure: false, // set to true in production with HTTPS
        sameSite: "lax",
        maxAge: 86400000, // 1 day
      })
      .json({
        success: true,
        message: "Logged in successfully",
        data: { user: { id: user.id, email: user.email, name: user.name } },
        error: null,
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      data: null,
      error: (err as Error).message,
    });
  }
};

// 🚪 Logout
export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token").json({
      success: true,
      message: "Logged out successfully",
      data: null,
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
      data: null,
      error: (err as Error).message,
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
        error: "USER_NOT_FOUND",
      });
    }
    res.json({
      success: true,
      message: "User fetched successfully",
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      data: null,
      error: (err as Error).message,
    });
  }
};

export const getAdmin = async (req: Request, res: Response) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admins only",
        data: null,
        error: "FORBIDDEN",
      });
    }
    res.json({
      success: true,
      message: "Welcome admin!",
      data: null,
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin data",
      data: null,
      error: (err as Error).message,
    });
  }
};
