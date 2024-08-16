import assert from "node:assert";
import AppError from "./AppError";
import { HttpStatusCode } from "../contants/http";
import AppErrorCode from "../contants/appErrorCode";

/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */

type AppAssert = (
  condition: any,
  httpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

const appAssert: AppAssert = (
  condition,
  httpStatusCode,
  message,
  appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
