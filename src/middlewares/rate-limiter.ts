import { Request, Response, NextFunction } from "express";
import { userLimiter, anonLimiter } from "../utils";
import { guestLimiter, memberLimiter, premiumLimiter } from "../utils";

// export async function rateLimitMiddleware(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const userId = req.cookies?.user_id; // adjust based on your cookie structure

//     console.log("userid in rate limiter", userId);
//     if (userId) {
//       await userLimiter.consume(userId); // use user ID from cookie
//     } else {
//       const ip = req.ip;
//       await anonLimiter.consume(ip!); // use IP for anonymous users
//     }

//     next(); // allowed
//   } catch (rejRes) {
//     res.status(429).json({
//       success: false,
//       message: "Too many requests. Please try again later.",
//     });
//   }
// }

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Assume `req.user` is set by your auth middleware
    const role = req.user?.role || "guest";
    const userId = req.user?.id || req.cookies?.user_id;
    const ip = req.ip;

    console.log("first role", role);
    console.log("userId", userId);
    console.log("ip", ip);

    let limiterKey = userId || ip;
    let limiter;

    switch (role) {
      case "premium":
        limiter = premiumLimiter;
        break;
      case "member":
        limiter = memberLimiter;
        break;
      default:
        limiter = guestLimiter;
        break;
    }

    console.log("first limiter", limiter);
    console.log("limiterKey", limiterKey);

    if (!limiter) {
      console.error("Limiter is undefined for role:", role);
      res.status(500).json({
        success: false,
        message: "Rate limiter is not configured properly.",
      });
      return; // Ensure no further execution
    }

    await limiter.consume(limiterKey); // userId or IP
    next();
  } catch (rejRes) {
    console.log("rejRes", rejRes);
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }
}
