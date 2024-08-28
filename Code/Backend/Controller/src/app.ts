import dotenv from 'dotenv';
import express, { NextFunction } from 'express';
import dbClient from "./components/DBClient";
import jwt from 'jsonwebtoken';
import logger from "./logger";
import { markConnectionsAndPackets, createNewPriorityQueue, updateNodesPriority, login, logout} from './components/MQHandle'; 
import { initRabbitMQ } from './components/MQHandle';
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

        const user = req.user;
        const routerId = user.routerId;
        const priorities = msg.priorities;
        await dbClient.insertNewPriorities(routerId, priorities);
        await createNewPriorityQueue(priorities);

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

        if(!msg || !msg.priorities || !msg.routerId){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        const routerId = msg.routerId;
        const priorities = msg.priorities;
        logger.info(`routerId: ${routerId}, priorities: ${priorities}`);
        for(let element of priorities){
            const serviceName = element.serviceName;
            const priority = element.priority;
            await dbClient.updatePriority(routerId, serviceName, priority);
            logger.info(`updated priority: ${priority} for service: ${serviceName} in db`);
            await updateNodesPriority(serviceName, priority);
            logger.info(`updated priority queue for service: ${serviceName} in router`);
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
        const msg = req.body;
        const username = msg['username'];
        const password = msg['password'];
        const publicIp = msg['publicIp'];

        if(!msg || !username || !password || !publicIp){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        if(!await dbClient.isUserExists(publicIp)){
            await dbClient.insertNewUser(publicIp);
        }

        const routerId:string = await dbClient.getRouterByPublicIp(publicIp) as string;

        logger.info(`username: ${username}, password: ${password}, publicIp: ${publicIp}, routerID: ${routerId}`);
        const response = await login(username.toString(), password.toString(), publicIp.toString(), routerId.toString());
        
        logger.info('message: ' + response);
        if(response === 'success'){
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
            await dbClient.deleteUser(publicIp);
            res.status(400).json({response: "failed to login"});
        }
    } 
   catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
   }
});

app.post('/logout', async (req, res) => {
    try{
        const response = await logout();
        res.status(200).json({response: response});
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }

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


async function startServer(){
    try{
        await dbClient.connectToDB();
        await dbClient.createTables();
        logger.info('Connected to database and created tables');
        app.listen(5000, () => {
            logger.info('Server is running on port 5000');
            initRabbitMQ();
            markConnectionsAndPackets();
        });
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
    }
}

startServer();
