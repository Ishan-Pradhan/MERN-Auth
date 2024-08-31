"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const resend_1 = __importDefault(require("../config/resend"));
const env_1 = require("../contants/env");
const getFromEmail = () => 
// NODE_ENV === "devlopment" ? "onboarding@resend.dev" : EMAIL_SENDER;
env_1.NODE_ENV === "devlopment" ? "onboarding@resend.dev" : "onboarding@resend.dev";
const getToEmail = (to) => 
// NODE_ENV === "devlopment" ? "delivered@resend.dev" : to;
env_1.NODE_ENV === "devlopment" ? "delivered@resend.dev" : "delivered@resend.dev";
const sendMail = async ({ to, subject, text, html }) => await resend_1.default.emails.send({
    from: getFromEmail(),
    to: getToEmail(to),
    subject,
    text,
    html,
});
exports.sendMail = sendMail;
