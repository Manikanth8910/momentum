import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AuthenticationError, ForbiddenError } from "../utils/appError.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;
  
  // 1. Get token from authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // Fallback to cookie if present
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AuthenticationError("You are not logged in. Please log in to gain access."));
  }

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production");

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AuthenticationError("The user belonging to this token no longer exists."));
  }

  // 4. Grant access to protected route
  req.user = currentUser;
  next();
});

// Role restriction middleware
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action."));
    }
    next();
  };
};
