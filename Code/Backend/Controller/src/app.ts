import dotenv from 'dotenv';
import express, { NextFunction } from 'express';
import dbClient from "./components/DBClient";
import jwt from 'jsonwebtoken';
import logger from "./logger";

dotenv.config();

const app = express();

app.use(express.json());

app.post('/service', authenticateToken, async (req: any, res: any) => {
    try{
        const msg = req.body;

        if(!msg || !msg.priorities){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        const upperTreeMsgParams: AddNodeToQueueTreeParams = {
            type: 'queue-tree',
            name: 'root',
            parent: 'global',
            maxLimit: '100M',
        }

        const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
        const response = await sendMessageToQueue(firstQueueTreeMsg);
        const user = req.user;
        const routerId = user.routerId;
        const priorities = msg.priorities;

        logger.info('priorities: ' + priorities);
        await dbClient.insertNewPriorities(routerId, priorities);
        for(let priority of priorities){
            const packetMark = priority + '-packet';
            const addNodeToQueueTreeParams: AddNodeToQueueTreeParams = {
                type: 'queue-tree',
                name: 'root',
                packetMark: packetMark,
                priority: (priorities.indexOf(priority) + 1).toString(),
            }

            const msgToPublish = JSON.stringify(addNodeToQueueTreeParams);
            const response = await sendMessageToQueue(msgToPublish);
            logger.info('response sent : ' + response);
        }
        res.status(200).json({response: "created new priority queue succesfully"});
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.put('/service', authenticateToken, async (req: any, res: any) => {
    try{
        const msg = req.body;
        let msgToPublish = [];

        if(!msg || !msg.priorities || !msg.routerId){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        const user = req.user;
        const routerId = user.routerId;
        const priorities = msg.priorities;
        for(let element of priorities){
            const serviceName = element.serviceName;
            const priority = element.priority;
            await dbClient.updatePriority(routerId, serviceName, priority);
            const updateNodePriority: UpdateNodePriorityParams = {
                type: 'update-node-priority',
                name: serviceName,
                newPriority: priority
            }
            
            const msgToPublish = JSON.stringify(updateNodePriority);
            const response = await sendMessageToQueue(msgToPublish);
        }

        res.status(200).json({response: "updated priority queue succesfully"});
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.get('/login', async (req, res) => {
   try {
        const msg = req.headers;
        const username = msg['username'];
        const password = msg['password'];
        const publicIp = msg['publicIp'];

        if(!msg || !username || !password || !publicIp){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        logger.info(`username: ${username}, password: ${password}, publicIp: ${publicIp}`);
        const msgToSend = {
            type: 'login',
            userame: username,
            password: password,
            publicIp: publicIp
        }
        const response = await sendMessageToQueue(JSON.stringify(msgToSend));
        logger.info('message: ' + response);
        if(response === 'success'){
            const routerId = dbClient.getRouterId(username);
            const payload = {routerId: routerId};
            const secret = process.env.ACCESS_TOKEN_SECRET;
            if (!secret) {
                throw new Error('ACCESS_TOKEN_SECRET is not defined');
            }
            const token = jwt.sign(payload, secret, {expiresIn: '1h'});
            const responseToUser = {
                token: token,
                message: response
            }
            res.status(200).json({response: responseToUser});
        }
        else{
            res.status(400).json({response: "failed to login"});
        }
    } 
   catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
   }
});

app.post('/logout', async (req, res) => {
    await sendMessageToQueue(JSON.stringify({type: 'logout'}));
});

app.post('/block-Service', authenticateToken, async (req: any, res: any) => {

});

async function authenticateToken(req: any, res: any, next: any){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    if(token == null){
        return res.sendStatus(401);
    }

    jwt.verify(token, secret, (err: any, user: any) => {
        if(err){
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`An error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(5000, () => {
    logger.info('Server is running on port 5000');
    initRabbitMQ().then(() => {
        sendConnectionMarksAndPacketMarks();
    });
});
