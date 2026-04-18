import prisma from "../../config/prisma.js";
import { comparePassword, hashPassword } from "./utils/password.utils.js";
import ApiError from "../../utils/api-error/index.js";
import { generateToken, verifyToken } from "../../utils/jwt/index.js";
import { sendEmail } from "../../services/email.service.js";
import { generateOtp, getOtpExpiry } from "./utils/otp.utils.js";

const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "30d";
const DEV_STATIC_OTP = process.env.DEV_STATIC_OTP || "123456";
const isProduction = process.env.NODE_ENV === "production";

const getOtpForEnvironment = () => (isProduction ? generateOtp() : DEV_STATIC_OTP);

const buildAuthPayload = (user) => ({
  id: user.id,
  role: user.role,
});

const issueAuthTokens = async (user) => {
  const payload = buildAuthPayload(user);
  const accessToken = generateToken(payload, ACCESS_TOKEN_EXPIRY);
  const refreshToken = generateToken(payload, REFRESH_TOKEN_EXPIRY);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

const sendOtpEmail = async ({ email, otp, purpose }) => {
  const actionLabel = purpose === "LOGIN" ? "login" : "account verification";

  await sendEmail({
    email,
    subject: `Zoyka ${actionLabel} OTP`,
    text: `Your OTP for ${actionLabel} is ${otp}. It is valid for 10 minutes.`,
  });
};

const getMatchingUsers = async ({ email, mobile }) => {
  return prisma.user.findMany({
    where: {
      OR: [{ email }, { mobile }],
    },
  });
};

export const signupService = async ({ name, email, mobile, password }) => {
  const matchedUsers = await getMatchingUsers({ email, mobile });

  if (matchedUsers.length > 1) {
    throw new ApiError(400, "Email or mobile is already linked to another account");
  }

  const matchedUser = matchedUsers[0];

  if (matchedUser?.isEmailVerified) {
    throw new ApiError(409, "User already registered. Please login.");
  }

  const otp = generateOtp();
  const otpExpiry = getOtpExpiry();
  const hashedPassword = await hashPassword(password);

  if (matchedUser) {
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        name,
        email,
        mobile,
        password: hashedPassword,
        otp,
        otpExpiry,
        otpPurpose: "SIGNUP",
        isEmailVerified: false,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: hashedPassword,
        otp,
        otpExpiry,
        otpPurpose: "SIGNUP",
      },
    });
  }

  await sendOtpEmail({ email, otp, purpose: "SIGNUP" });

  return { message: "OTP sent to your email for signup verification" };
};

export const createStaffService = async ({ name, email, mobile, password, role }) => {
  const matchedUsers = await getMatchingUsers({ email, mobile });
  if (matchedUsers.length > 0) {
    throw new ApiError(400, "Email or mobile is already linked to another account");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      mobile,
      password: hashedPassword,
      role,
      isEmailVerified: true,
    },
  });

  return { message: `${role} account created successfully.` };
};

export const verifySignupOtpService = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found. Please signup first.");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Account already verified. Please login.");
  }

  if (user.otpPurpose !== "SIGNUP") {
    throw new ApiError(400, "Invalid OTP request type for signup verification");
  }

  if (!user.otp || user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (!user.otpExpiry || new Date() > user.otpExpiry) {
    throw new ApiError(400, "OTP expired. Please request a new OTP.");
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      otp: null,
      otpExpiry: null,
      otpPurpose: null,
    },
  });

  const tokens = await issueAuthTokens(verifiedUser);

  return {
    message: "Signup verification successful",
    role: verifiedUser.role,
    ...tokens,
  };
};

// export const requestLoginOtpService = async ({ email, password }) => {
//   const user = await prisma.user.findUnique({
//     where: { email },
//   });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   if (!user.isEmailVerified) {
//     throw new ApiError(403, "Email not verified. Complete signup verification first.");
//   }

//   const isPasswordValid = await comparePassword(password, user.password);

//   if (!isPasswordValid) {
//     throw new ApiError(400, "Invalid email or password");
//   }

//   const otp = generateOtp();
//   const otpExpiry = getOtpExpiry();

//   await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       otp,
//       otpExpiry,
//       otpPurpose: "LOGIN",
//     },
//   });

//   await sendOtpEmail({ email: user.email, otp, purpose: "LOGIN" });

//   return { message: "OTP sent to your email for login verification" };
// };

// export const verifyLoginOtpService = async ({ email, otp }) => {
//   const user = await prisma.user.findUnique({
//     where: { email },
//   });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   if (!user.isEmailVerified) {
//     throw new ApiError(403, "Email not verified");
//   }

//   if (user.otpPurpose !== "LOGIN") {
//     throw new ApiError(400, "Invalid OTP request type for login");
//   }

//   if (!user.otp || user.otp !== otp) {
//     throw new ApiError(400, "Invalid OTP");
//   }

//   if (!user.otpExpiry || new Date() > user.otpExpiry) {
//     throw new ApiError(400, "OTP expired. Please request a new OTP.");
//   }

//   const loggedInUser = await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       otp: null,
//       otpExpiry: null,
//       otpPurpose: null,
//     },
//   });

//   const tokens = await issueAuthTokens(loggedInUser);

//   return {
//     message: "Login successful",
//     ...tokens,
//   };
// };

export const resendOtpService = async ({ email, purpose }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (purpose === "SIGNUP" && user.isEmailVerified) {
    throw new ApiError(400, "Account already verified. Please login.");
  }

  if (purpose === "LOGIN" && !user.isEmailVerified) {
    throw new ApiError(400, "Email is not verified yet.");
  }

  const otp = generateOtp();
  const otpExpiry = getOtpExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiry,
      otpPurpose: purpose,
    },
  });

  await sendOtpEmail({ email, otp, purpose });

  return {
    message: `OTP resent for ${purpose.toLowerCase()} verification`,
  };
};

export const loginService = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Email not verified. Complete signup verification first.");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid email or password");
  }

  const tokens = await issueAuthTokens(user);

  return {
    message: "Login successful",
    role: user.role,
    ...tokens,
  };
};

export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const payload = verifyToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.refreshToken || user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokens = await issueAuthTokens(user);

  return {
    message: "Token refreshed",
    role: user.role,
    ...tokens,
  };
};

export const googleAuthService = async ({ accessToken }) => {
  // Use Google's userinfo API with the access token
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new ApiError(401, "Invalid Google token");
  }

  const payload = await res.json();
  if (!payload || !payload.email) {
    throw new ApiError(401, "Invalid Google token payload");
  }

  const { sub: googleId, email, name, picture } = payload;

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Existing user — link Google account if not already linked
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, authProvider: "google", avatar: user.avatar || picture },
      });
    }
  } else {
    // New user — create account via Google
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        googleId,
        authProvider: "google",
        avatar: picture,
        isEmailVerified: true,
      },
    });
  }

  const tokens = await issueAuthTokens(user);

  return {
    message: "Google login successful",
    role: user.role,
    ...tokens,
  };
};