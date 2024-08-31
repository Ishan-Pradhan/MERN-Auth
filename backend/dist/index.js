"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const env_1 = require("./contants/env");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const http_1 = require("./contants/http");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const authenticate_1 = __importDefault(require("./middleware/authenticate"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const session_route_1 = __importDefault(require("./routes/session.route"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin: env_1.APP_ORIGIN, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res, next) => {
    return res.status(http_1.OK).json({ status: "healthy" });
});
app.use("/auth", auth_route_1.default);
//protected routes
app.use("/user", authenticate_1.default, user_route_1.default);
app.use("/sessions", authenticate_1.default, session_route_1.default);
app.use(errorHandler_1.default);
app.listen(4004, async () => {
    console.log(`Server is running on port ${env_1.PORT} in ${env_1.NODE_ENV} environment`);
    await (0, db_1.default)();
});
