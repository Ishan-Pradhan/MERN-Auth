import { JWT_REFRESH_SECRET, JWT_SECRET } from "../contants/env";
import jwt, { Secret } from "jsonwebtoken";

import VerificationCodeType from "../contants/verificationCodeType";
import SessionModel from "../models/session.model";
import Usermodel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { oneYearFromNow } from "../utils/date";
import appAssert from "../utils/appAssert";
import { CONFLICT, UNAUTHORIZED } from "../contants/http";
import { refreshtokenSignOptions, signToken } from "../utils/jwt";

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

  appAssert(!existingUser, CONFLICT, "Email already in use");

  //create user
  const user = new Usermodel({
    email: data.email,
    password: data.password,
  });

  const userId = user._id;

  await user.save();
  //create verifcation code
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });
  //send verification email

  //create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });
  //sign access token and refresh token
  const refreshToken = signToken(
    { sessionId: session._id },
    refreshtokenSignOptions
  );
  const accessToken = signToken({ userId: user._id, sessionId: session._id });
  //return user and tokens
  return { user: user.omitPassword(), accessToken, refreshToken };
};

type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  //get the user by email
  const user = await Usermodel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  //verify if exist
  //validate password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  //create a session
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  const sessionInfo = {
    sessionId: session._id,
  };
  //sign access token and refresh token
  const refreshToken = signToken(sessionInfo, refreshtokenSignOptions);

  const accessToken = signToken({
    ...sessionInfo,
    userId: user._id,
  });

  //return user and tokens
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};


// 1:42.57