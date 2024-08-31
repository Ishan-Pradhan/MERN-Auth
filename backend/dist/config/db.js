"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../contants/env");
const connectToDatabase = async () => {
    try {
        await mongoose_1.default.connect(env_1.MONGO_URI);
    }
    catch (error) {
        console.log("Could not connect to database", error);
        process.exit(1);
    }
};
exports.default = connectToDatabase;
