import { JWT_REFRESH_SECRET } from "../contants/env";
import jwt, { Secret } from "jsonwebtoken";

import VerificationCodeType from "../contants/verificationCodeType";
import SessionModel from "../models/session.model";
import Usermodel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { oneYearFromNow } from "../utils/date";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
  //verify existing user doesn't exist
  const existingUser = await Usermodel.exists({
    email: data.email,
  });
  if (existingUser) {
    throw new Error("User already exists");
  }
  //create user
  const user = await Usermodel.create({
    email: data.email,
    password: data.password,
  });
  //create verifcation code
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });
  //send verification email

  //create session
  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });
  //sign access token and refresh token
  const refreshToken = jwt.sign(
    { sessionId: session._id },
    JWT_REFRESH_SECRET,
    { audience: ["user"], expiresIn: "30d" }
  );
  const accessToken = jwt.sign({ sessionId: session._id }, JWT_REFRESH_SECRET, {
    audience: ["user"],
    expiresIn: "15m",
  });
  //return user and tokens
  return { user, accessToken, refreshToken };
};
