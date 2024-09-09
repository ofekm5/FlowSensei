"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DBClient_1 = __importDefault(require("./components/DBClient"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const createRouter = (rabbitMQClient, secret) => {
    const router = express_1.default.Router();
    async function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }
        if (token == null) {
            return res.sendStatus(401); // No token provided
        }
        jsonwebtoken_1.default.verify(token, secret, (err, payload) => {
            if (err) {
                return res.sendStatus(403); // Invalid token
            }
            req.routerId = payload.routerId;
            next();
        });
    }
    router.post('/service', authenticateToken, async (req, res) => {
        try {
            const msg = req.body;
            if (!msg || !msg.priorities) {
                res.status(400).json({ error: 'invalid request' });
                logger_1.default.info('Invalid request: ' + msg);
                return;
            }
            const routerId = req.routerId;
            ;
            const priorities = msg.priorities;
            await DBClient_1.default.insertNewPriorities(routerId, priorities);
            await rabbitMQClient.createNewPriorityQueue(priorities);
            res.status(200).json({ response: "created new priority queue successfully" });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    router.put('/service', authenticateToken, async (req, res) => {
        try {
            const msg = req.body;
            if (!msg || !msg.priorities || !msg.routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger_1.default.info('Invalid request: ' + msg);
                return;
            }
            const routerId = req.routerId;
            const priorities = msg.priorities;
            logger_1.default.info(`routerId: ${routerId}, priorities: ${priorities}`);
            for (let element of priorities) {
                const serviceName = element.serviceName;
                const priority = element.priority;
                await DBClient_1.default.updatePriority(routerId, serviceName, priority);
                logger_1.default.info(`updated priority: ${priority} for service: ${serviceName} in db`);
                await rabbitMQClient.updateNodesPriority(serviceName, priority);
                logger_1.default.info(`updated priority queue for service: ${serviceName} in router`);
            }
            res.status(200).json({ response: "updated priority queue successfully" });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    router.delete('/service', authenticateToken, async (req, res) => {
        try {
            const msg = req.body;
            if (!msg || !msg.serviceName || !msg.routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger_1.default.info('Invalid request: ' + msg);
                return;
            }
            const routerId = req.routerId;
            const serviceName = msg.serviceName;
            await DBClient_1.default.deleteService(routerId, serviceName);
            await rabbitMQClient.deleteNode(routerId, serviceName);
            res.status(200).json({ response: "deleted service successfully" });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    router.post('/login', async (req, res) => {
        try {
            const msg = req.body;
            const username = msg['username'];
            const password = msg['password'];
            const publicIp = msg['publicIp'];
            if (!msg || !username || !password || !publicIp) {
                res.status(400).json({ error: 'invalid request' });
                logger_1.default.info('Invalid request: ' + msg);
                return;
            }
            const routerId = await DBClient_1.default.getRouterID(publicIp);
            if (!routerId) {
                await DBClient_1.default.insertNewRouter(publicIp);
                logger_1.default.info(`New router with public IP ${publicIp} inserted`);
            }
            else {
                logger_1.default.info(`Router with public IP ${publicIp} already exists with ID ${routerId}`);
            }
            logger_1.default.info(`username: ${username}, password: ${password}, publicIp: ${publicIp}, routerID: ${routerId}`);
            const response = await rabbitMQClient.login(username.toString(), password.toString(), publicIp.toString(), routerId.toString());
            logger_1.default.info('message: ' + response);
            if (response === 'success') {
                const payload = { routerId: routerId };
                const secret = process.env.ACCESS_TOKEN_SECRET;
                if (!secret) {
                    throw new Error('ACCESS_TOKEN_SECRET is not defined');
                }
                const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '3h' });
                const responseToUser = {
                    token: token,
                    message: response
                };
                res.status(200).json({ response: responseToUser });
            }
            else {
                await DBClient_1.default.deleteRouter(publicIp);
                res.status(400).json({ response: "failed to login" });
            }
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    router.post('/logout', authenticateToken, async (req, res) => {
        try {
            const routerId = req.routerId;
            const response = await rabbitMQClient.logout(routerId);
            res.status(200).json({ response: response });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    return router;
};
exports.default = createRouter;
