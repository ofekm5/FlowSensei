import express from 'express';
import jwt from 'jsonwebtoken';
import logger from "./logger";

const createRouter = () => {
    const router = express.Router();

    async function authenticateToken(req: any, res: any, next: any) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';

        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }

        if (token == null) {
            return res.sendStatus(401);
        }

        jwt.verify(token, secret, (err: any, user: any) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    }

    router.post('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;

            if (!msg || !msg.priorities) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            // Mock logic for creating a new priority queue
            const priorities = msg.priorities;
            logger.info(`Received priorities: ${JSON.stringify(priorities)}`);
            res.status(200).json({ response: "created new priority queue successfully (mock)" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.put('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;

            if (!msg || !msg.priorities || !msg.routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            // Mock logic for updating priority queue
            logger.info(`Updated priorities for routerId: ${msg.routerId}`);
            res.status(200).json({ response: "updated priority queue successfully (mock)" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.delete('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;

            if (!msg || !msg.serviceName || !msg.routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            // Mock logic for deleting a service
            logger.info(`Deleted serviceName: ${msg.serviceName} for routerId: ${msg.routerId}`);
            res.status(200).json({ response: "deleted service successfully (mock)" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
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
                logger.info('Invalid request: ' + msg);
                return;
            }

            // Mock user authentication logic
            const mockRouterId = 'mockRouterId';
            const secret = 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';
            if (!secret) {
                throw new Error('ACCESS_TOKEN_SECRET is not defined');
            }

            const token = jwt.sign({ routerId: mockRouterId }, secret, { expiresIn: '1h' });
            logger.info(`Logged in user: ${username}`);

            res.status(200).json({
                response: {
                    token: token,
                    message: 'success (mock)'
                }
            });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.post('/logout', async (req, res) => {
        try {
            // Mock logout logic
            res.status(200).json({ response: "logged out successfully (mock)" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    return router;
};

export default createRouter;
