"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const createRouter = () => {
    const router = express_1.default.Router();
    async function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';
        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }
        if (token == null) {
            return res.sendStatus(401);
        }
        jsonwebtoken_1.default.verify(token, secret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
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
            // Mock logic for creating a new priority queue
            const priorities = msg.priorities;
            logger_1.default.info(`Received priorities: ${JSON.stringify(priorities)}`);
            res.status(200).json({ response: "created new priority queue successfully (mock)" });
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
            // Mock logic for updating priority queue
            logger_1.default.info(`Updated priorities for routerId: ${msg.routerId}`);
            res.status(200).json({ response: "updated priority queue successfully (mock)" });
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
            // Mock logic for deleting a service
            logger_1.default.info(`Deleted serviceName: ${msg.serviceName} for routerId: ${msg.routerId}`);
            res.status(200).json({ response: "deleted service successfully (mock)" });
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
            if (!msg || !username || !password) {
                res.status(400).json({ error: 'invalid request' });
                logger_1.default.info('Invalid request: ' + msg);
                return;
            }
            // Mock user authentication logic
            const mockRouterId = 'mockRouterId';
            const secret = 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';
            if (!secret) {
                throw new Error('ACCESS_TOKEN_SECRET is not defined');
            }
            const token = jsonwebtoken_1.default.sign({ routerId: mockRouterId }, secret, { expiresIn: '1h' });
            logger_1.default.info(`Logged in user: ${username}`);
            res.status(200).json({
                response: {
                    token: token,
                    message: 'success (mock)'
                }
            });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    router.post('/logout', async (req, res) => {
        try {
            // Mock logout logic
            res.status(200).json({ response: "logged out successfully (mock)" });
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });
    return router;
};
exports.default = createRouter;
