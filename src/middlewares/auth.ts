import { NextFunction, Request, Response } from "express";

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import jwt from "jsonwebtoken";

export const verifyToken = (
  token: string
): { id: string; role: string } | null => {
  const JWT_SECRET = process.env.JWT_SECRET!;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
  } catch {
    return null;
  }
};

/**
 * Generates a JSON Web Token (JWT) for the given user.
 *
 * @param user - An object representing the user, containing the user's `id` and `role`.
 * @returns A signed JWT string with the user's `id` and `role`, valid for 1 hour.
 *
 * @throws Will throw an error if the `JWT_SECRET` environment variable is not defined.
 */
export const generateToken = (user: { id: string; role: string }) => {
  const JWT_SECRET = process.env.JWT_SECRET!;
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

// 🛡️ Middleware to protect routes
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const JWT_SECRET = process.env.JWT_SECRET!;
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.sendStatus(403);
  }
};
