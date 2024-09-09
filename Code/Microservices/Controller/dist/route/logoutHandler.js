"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = void 0;
const logger_1 = __importDefault(require("../logger"));
const logoutHandler = async (req, res, rabbitMQClient) => {
    try {
        const routerId = req.routerId;
        const response = await rabbitMQClient.disconnect(routerId);
        res.status(200).json({ response: response });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.logoutHandler = logoutHandler;
