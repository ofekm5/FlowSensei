import logger from "./logger";
import publisher from "./components/MQPublisher";
import consumer from "./components/MQConsumer";
import express, { NextFunction } from 'express';
import dbClient from "./components/DBClient";
const jwt = require('jsonwebtoken');
require('dotenv').config();


const app = express();
app.use(express.json()); 


app.post('/createNewPriorityQueue', authenticateToken, async (req: any, res: any) => {
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
        logger.info('priorities: ' + priorities);
        const msgToPublish = {
            type: 'createNewPriorityQueue',
            priorities: priorities
        }
        await dbClient.insertNewPriorities(routerId, priorities);
        await publisher.publish(msgToPublish);
        await consumer.consume();
        consumer.events.on('message', (message: any) => {
            logger.info('message: ' + message);
            res.status(200).json({response: message});
        });
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.put('/updatePriorityQueue', authenticateToken, async (req: any, res: any) => {
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
            const serviceToPriority = {
                serviceName: serviceName,
                priority: priority
            }
            msgToPublish.push(serviceToPriority);
        }

        await publisher.publish(msgToPublish);
        const response = consumer.consume();
        consumer.events.on('message', (message: any) => {
            logger.info('message: ' + message);
            res.status(200).json({response: message});
        });
    }
    catch(error){
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.get('/login', async (req, res) => {
   try {
    //TODO change to use request headers

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
            username: username,
            password: password,
            publicIp: publicIp
        }
        await publisher.publish(msgToSend);
        await consumer.consume();
        consumer.events.on('message', (message: any) => {
            logger.info('message: ' + message);
            if(message === 'success'){
                const routerId = dbClient.getRouterId(username);
                const payload = {routerId: routerId};
                const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
                const responseToUser = {
                    token: token,
                    message: message
                }
                res.status(200).json({response: responseToUser});
            }
            else{
                res.status(400).json({response: message});
            }
        });
   } 
   catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
   }
});

app.post('/signUp', async (req, res) => {
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
        const msgToPublish = {
            type: 'signUp',
            username: username,
            password: password,
            publicIp: publicIp
        }
        await publisher.publish(msgToPublish)
        await consumer.consume();
        consumer.events.on('message', async (message: any) => {
            logger.info('message: ' + message);
            if(message === 'success'){
                await dbClient.insertNewUser(username);
                res.status(200).json({response: message});
            }
            else{
                res.status(400).json({response: message});
            }
        });

        logger.info(`username: ${username}, password: ${password}, publicIp: ${publicIp}`);
    }
    catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.post('/logout', async (req, res) => {

});

function authenticateToken(req: any, res: any, next: any){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null){
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
        if(err){
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
    
}


app.listen(5000, () => {
    logger.info('Server is running on port 5000');
    
});

