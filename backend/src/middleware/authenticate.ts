import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../contants/http";
import AppErrorCode from "../contants/appErrorCode";
import { verifyToken } from "../utils/jwt";
import mongoose from "mongoose";

const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAssert(
    accessToken,
    UNAUTHORIZED,
    "Not authorized",
    AppErrorCode.InvalidAccessToken
  );
  const { error, payload } = verifyToken(accessToken);

  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "Token expired" : "Invalid token",
    AppErrorCode.InvalidAccessToken
  );

  req.userId = new mongoose.Types.ObjectId(payload.userId as string);
  req.sessionId = new mongoose.Types.ObjectId(payload.sessionId as string);
  next();
};

export default authenticate;
