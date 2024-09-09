"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceListHandler = void 0;
const DBClient_1 = __importDefault(require("../components/DBClient"));
const logger_1 = __importDefault(require("../logger"));
const serviceListHandler = async (req, res) => {
    try {
        const routerId = req.routerId;
        const services = await DBClient_1.default.getServices(routerId);
        res.status(200).json({ response: services });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
        res.status(500).json({ error: 'An error has occurred ' + error });
    }
};
exports.serviceListHandler = serviceListHandler;
