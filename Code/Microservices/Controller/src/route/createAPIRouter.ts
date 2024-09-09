import express from 'express';
import jwt from 'jsonwebtoken';
import { RabbitMQClient } from "../components/RabbitMQClient";
import { loginHandler } from "./loginHandler";
import { logoutHandler } from "./logoutHandler";
import { serviceListHandler } from "./serviceListHandler";
import { createServiceHandler, updateServiceHandler, deleteServiceHandler } from "./serviceHandler";
import { fetchKibana } from "./fetchKibana";

const createAPIRouter = (rabbitMQClient: RabbitMQClient, secret: string) => {
    const router = express.Router();

    async function authenticateToken(req: any, res: any, next: any) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = process.env.ACCESS_TOKEN_SECRET;

        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }

        if (token == null) {
            return res.sendStatus(401);  
        }

        jwt.verify(token, secret, (err: any, payload: any) => {
            if (err) {
                return res.sendStatus(403);  // Invalid token
            }
            req.routerId = payload.routerId;

            next();
        });
    }

    router.get('/initialize-router/:routerIp', (req, res) => fetchKibana(req, res, rabbitMQClient));
    router.post('/login', (req, res) => loginHandler(req, res, rabbitMQClient, secret));
    router.post('/logout', authenticateToken, (req, res) => logoutHandler(req, res, rabbitMQClient));
    router.get('/service-list', authenticateToken, serviceListHandler);
    router.post('/service', authenticateToken, (req, res) => createServiceHandler(req, res, rabbitMQClient));
    router.put('/service', authenticateToken, (req, res) => updateServiceHandler(req, res, rabbitMQClient));
    router.delete('/service', authenticateToken, (req, res) => deleteServiceHandler(req, res, rabbitMQClient));

    return router;
};

export default createAPIRouter;
