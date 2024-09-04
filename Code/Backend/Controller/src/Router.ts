import express from 'express';
import dbClient from "./components/DBClient";
import jwt from 'jsonwebtoken';
import logger from "./logger";
import { RabbitMQClient } from "./components/RabbitMQClient";

const createRouter = (rabbitMQClient: RabbitMQClient, secret:string) => {
    const router = express.Router();

    async function authenticateToken(req: any, res: any, next: any) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const secret = process.env.ACCESS_TOKEN_SECRET;
    
        if (!secret) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }
    
        if (token == null) {
            return res.sendStatus(401);  // No token provided
        }
    
        jwt.verify(token, secret, (err: any, payload: any) => {
            if (err) {
                return res.sendStatus(403);  // Invalid token
            }
            req.routerId = payload.routerId;
    
            next();
        });
    }

    router.post('/login', async (req, res) => {
        try {
            const msg = req.body;
            const username = msg['username'];
            const password = msg['password'];
            const publicIp = msg['publicIp'];

            if (!msg || !username || !password || !publicIp) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            const routerId: string = await dbClient.getRouterID(publicIp) as string;

            if (!routerId) {
                await dbClient.insertNewRouter(publicIp);
                logger.info(`New router with public IP ${publicIp} inserted`);
            } 
            else {
                logger.info(`Router with public IP ${publicIp} already exists with ID ${routerId}`);
            }
            
            logger.info(`username: ${username}, password: ${password}, publicIp: ${publicIp}, routerID: ${routerId}`);
            const response = await rabbitMQClient.login(username.toString(), password.toString(), publicIp.toString(), routerId.toString());

            logger.info('message: ' + response);
            if (response === 'success') {
                const payload = { routerId: routerId };
                const secret = process.env.ACCESS_TOKEN_SECRET;
                if (!secret) {
                    throw new Error('ACCESS_TOKEN_SECRET is not defined');
                }
                const token = jwt.sign(payload, secret, { expiresIn: '3h' });
                const responseToUser = {
                    token: token,
                    message: response
                };
                res.status(200).json({ response: responseToUser });
            } 
            else {
                await dbClient.deleteRouter(publicIp);
                res.status(400).json({ response: "failed to login" });
            }
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.post('/logout', authenticateToken, async (req:any, res:any) => {
        try {
            const routerId = req.routerId;
            const response = await rabbitMQClient.logout(routerId);
            res.status(200).json({ response: response });
        } 
        catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.get('/services', authenticateToken, async (req: any, res: any) => {
        try {
            const routerId = req.routerId;
            const services = await dbClient.getServicesByRouterId(routerId);
            res.status(200).json({ response: services });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.post('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;
            const routerId = req.routerId;
            const properties = msg.properties;
            service,
            protocol,
            dstPort,
            srcPort,
            srcAddress,
            dstAddress

            if (!msg || !properties || ) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            
            await dbClient.insertNewPriorities(routerId, properties);
            //todo: not each time is needed to create new queue
            await rabbitMQClient.createNewPriorityQueue(properties);

            res.status(200).json({ response: "created new priority queue successfully" });
        } 
        catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.put('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;
            const routerId = req.routerId;

            if (!msg || !msg.priorities || !msg.routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            const priorities = msg.priorities;
            logger.info(`routerId: ${routerId}, priorities: ${priorities}`);
            for (let element of priorities) {
                const serviceName = element.serviceName;
                const priority = element.priority;
                await dbClient.updatePriority(routerId, serviceName, priority);
                logger.info(`updated priority: ${priority} for service: ${serviceName} in db`);
                await rabbitMQClient.updateNodesPriority(serviceName, priority);
                logger.info(`updated priority queue for service: ${serviceName} in router`);
            }

            res.status(200).json({ response: "updated priority queue successfully" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    router.delete('/service', authenticateToken, async (req: any, res: any) => {
        try {
            const msg = req.body;
            const routerId = req.routerId;

            if (!msg || !msg.serviceName || !routerId) {
                res.status(400).json({ error: 'invalid request' });
                logger.info('Invalid request: ' + msg);
                return;
            }

            const serviceName = msg.serviceName;
            await dbClient.deleteService(routerId, serviceName);
            await rabbitMQClient.deleteNode(routerId, serviceName);
            res.status(200).json({ response: "deleted service successfully" });
        } catch (error) {
            logger.error('An error has occurred: ' + error);
            res.status(500).json({ error: 'An error has occurred ' + error });
        }
    });

    return router;
};

export default createRouter;
