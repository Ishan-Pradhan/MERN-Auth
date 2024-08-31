"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.sendPasswordResetEmail = exports.verifyEmail = exports.refreshUserAccessToken = exports.loginUser = exports.createAccount = void 0;
const env_1 = require("../contants/env");
const session_model_1 = __importDefault(require("../models/session.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verificationCode_model_1 = __importDefault(require("../models/verificationCode.model"));
const date_1 = require("../utils/date");
const appAssert_1 = __importDefault(require("../utils/appAssert"));
const http_1 = require("../contants/http");
const jwt_1 = require("../utils/jwt");
const sendMail_1 = require("../utils/sendMail");
const emailTemplate_1 = require("../utils/emailTemplate");
const bcrypt_1 = require("../utils/bcrypt");
const createAccount = async (data) => {
    //verify existing user doesn't exist
    const existingUser = await user_model_1.default.exists({
        email: data.email,
    });
    (0, appAssert_1.default)(!existingUser, http_1.CONFLICT, "Email already in use");
    //create user
    const user = new user_model_1.default({
        email: data.email,
        password: data.password,
    });
    const userId = user._id;
    await user.save();
    //create verifcation code
    const verificationCode = await verificationCode_model_1.default.create({
        userId: user._id,
        type: "email_verification" /* VerificationCodeType.EmailVerification */,
        expiresAt: (0, date_1.oneYearFromNow)(),
    });
    const url = `${env_1.APP_ORIGIN}/email/verify/${verificationCode._id}`;
    //send verification email
    const { error } = await (0, sendMail_1.sendMail)({
        to: user.email,
        ...(0, emailTemplate_1.getVerifyEmailTemplate)(url),
    });
    if (error) {
        console.log(error);
    }
    //2.23.40
    //create session
    const session = await session_model_1.default.create({
        userId,
        userAgent: data.userAgent,
    });
    //sign access token and refresh token
    const refreshToken = (0, jwt_1.signToken)({ sessionId: session._id }, jwt_1.refreshtokenSignOptions);
    const accessToken = (0, jwt_1.signToken)({ userId: user._id, sessionId: session._id });
    //return user and tokens
    return { user: user.omitPassword(), accessToken, refreshToken };
};
exports.createAccount = createAccount;
const loginUser = async ({ email, password, userAgent, }) => {
    //get the user by email
    const user = await user_model_1.default.findOne({ email });
    (0, appAssert_1.default)(user, http_1.UNAUTHORIZED, "Invalid email or password");
    //verify if exist
    //validate password from the request
    const isValid = await user.comparePassword(password);
    (0, appAssert_1.default)(isValid, http_1.UNAUTHORIZED, "Invalid email or password");
    const userId = user._id;
    //create a session
    const session = await session_model_1.default.create({
        userId,
        userAgent,
    });
    const sessionInfo = {
        sessionId: session._id,
    };
    //sign access token and refresh token
    const refreshToken = (0, jwt_1.signToken)(sessionInfo, jwt_1.refreshtokenSignOptions);
    const accessToken = (0, jwt_1.signToken)({
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
exports.loginUser = loginUser;
const refreshUserAccessToken = async (refreshToken) => {
    const { payload } = (0, jwt_1.verifyToken)(refreshToken, {
        secret: jwt_1.refreshtokenSignOptions.secret,
    });
    (0, appAssert_1.default)(payload, http_1.UNAUTHORIZED, "Invalid refresh token");
    const now = Date.now();
    const session = await session_model_1.default.findById(payload.sessionId);
    (0, appAssert_1.default)(session && session?.expiresAt.getTime() > now, http_1.UNAUTHORIZED, "Session expired");
    // refresh the session if it expires in the next 24 hours
    const sessionNeedsRefresh = session.expiresAt.getTime() - now < date_1.ONE_DAY_MS;
    if (sessionNeedsRefresh) {
        session.expiresAt = (0, date_1.thirtyDaysFromNow)();
        await session.save();
    }
    const newRefreshToken = sessionNeedsRefresh
        ? (0, jwt_1.signToken)({ sessionId: session._id }, jwt_1.refreshtokenSignOptions)
        : undefined;
    const accessToken = (0, jwt_1.signToken)({
        userId: session.userId,
        sessionId: session._id,
    });
    return {
        accessToken,
        newRefreshToken,
    };
};
exports.refreshUserAccessToken = refreshUserAccessToken;
const verifyEmail = async (code) => {
    //get the verification code
    const validCode = await verificationCode_model_1.default.findOne({
        _id: code,
        type: "email_verification" /* VerificationCodeType.EmailVerification */,
        expiresAt: { $gt: new Date() },
    });
    (0, appAssert_1.default)(validCode, http_1.NOT_FOUND, "Invalid or expired verification code");
    //update user to verified true
    const updatedUser = await user_model_1.default.findByIdAndUpdate(validCode.userId, {
        verified: true,
    }, { new: true });
    (0, appAssert_1.default)(updatedUser, http_1.INTERNAL_SERVER_ERROR, "Failed to verify email");
    //delete verification code
    await validCode.deleteOne();
    //return user
    return {
        user: updatedUser.omitPassword(),
    };
};
exports.verifyEmail = verifyEmail;
const sendPasswordResetEmail = async (email) => {
    //get the user by email
    const user = await user_model_1.default.findOne({ email });
    (0, appAssert_1.default)(user, http_1.NOT_FOUND, "User not found");
    // check email rate limit
    const fiveMinAgo = (0, date_1.fiveMinutesAgo)();
    const count = await verificationCode_model_1.default.countDocuments({
        userId: user._id,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        createdAt: { $gt: fiveMinAgo },
    });
    (0, appAssert_1.default)(count <= 1, http_1.TOO_MANY_REQUESTS, "Too many password reset requests, please try again later");
    // create verification code
    const expiresAt = (0, date_1.oneHourFromNow)();
    const verificationCode = await verificationCode_model_1.default.create({
        userId: user._id,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        expiresAt,
    });
    //send verificaiton mail
    const url = `${env_1.APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;
    const { data, error } = await (0, sendMail_1.sendMail)({
        to: user.email,
        ...(0, emailTemplate_1.getPasswordResetTemplate)(url),
    });
    (0, appAssert_1.default)(data?.id, http_1.INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);
    // return success
    return {
        url,
        emailId: data.id,
    };
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const resetPassword = async ({ password, verificationCode, }) => {
    //get verification code
    const validCode = await verificationCode_model_1.default.findOne({
        _id: verificationCode,
        type: "password_reset" /* VerificationCodeType.PasswordReset */,
        expiresAt: { $gt: new Date() },
    });
    (0, appAssert_1.default)(validCode, http_1.NOT_FOUND, "Invalid or expired verification code");
    //update the users password
    const updatedUser = await user_model_1.default.findByIdAndUpdate(validCode.userId, {
        password: await (0, bcrypt_1.hashValue)(password),
    });
    (0, appAssert_1.default)(updatedUser, http_1.INTERNAL_SERVER_ERROR, "Failed to reset password");
    //delete verification code
    await validCode.deleteOne();
    //delete all sessions
    await session_model_1.default.deleteMany({
        userId: updatedUser._id,
    });
    return {
        user: updatedUser.omitPassword(),
    };
};
exports.resetPassword = resetPassword;
