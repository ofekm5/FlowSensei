"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const loginHandler_1 = require("./loginHandler");
const logoutHandler_1 = require("./logoutHandler");
const serviceListHandler_1 = require("./serviceListHandler");
const serviceHandler_1 = require("./serviceHandler");
const createAPIRouter = (rabbitMQClient, secret) => {
    const router = express_1.default.Router();
    async function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }
        if (token == null) {
            return res.sendStatus(401);
        }
        jsonwebtoken_1.default.verify(token, secret, (err, payload) => {
            if (err) {
                return res.sendStatus(403); // Invalid token
            }
            req.routerId = payload.routerId;
            next();
        });
    }
    router.post('/login', (req, res) => (0, loginHandler_1.loginHandler)(req, res, rabbitMQClient, secret));
    router.post('/logout', authenticateToken, (req, res) => (0, logoutHandler_1.logoutHandler)(req, res, rabbitMQClient));
    router.get('/service-list', authenticateToken, serviceListHandler_1.serviceListHandler);
    router.post('/service', authenticateToken, (req, res) => (0, serviceHandler_1.createServiceHandler)(req, res, rabbitMQClient));
    router.put('/service', authenticateToken, (req, res) => (0, serviceHandler_1.updateServiceHandler)(req, res, rabbitMQClient));
    router.delete('/service', authenticateToken, (req, res) => (0, serviceHandler_1.deleteServiceHandler)(req, res, rabbitMQClient));
    return router;
};
exports.default = createAPIRouter;
