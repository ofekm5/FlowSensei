import logger from "./logger";
import publisher from "./components/MQPublisher";
import consumer from "./components/MQConsumer";
import express, { NextFunction } from 'express';
import dbClient from "./components/DBClient";
import amqp from 'amqplib/callback_api';
import { v4 as uuidv4 } from 'uuid';
import { connect } from "amqplib";
const jwt = require('jsonwebtoken');
const exchange = 'requests_exchange';
const clientId = 'client1'; 
const RABBITMQ_URL = 'amqp://localhost';
const REQUEST_QUEUE = 'request_queue';
const RESPONSE_QUEUE = 'response_queue'; 
let channel: amqp.Channel;
let connection: amqp.Connection;

require('dotenv').config();


interface MarkParams{
    chain: string,
    connectionMark?: string,
    passthrough?: string,
    protocol?: string,
    inInterface?: string;
    outInterface?: string;
    srcAddress?: string;
    srcPort?: string;
    dstPort?: string;
    dstAddress?: string;
}

interface ConnectionMarkParams extends MarkParams{
    srcAdresses?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

interface PacketMarkParams extends MarkParams{
    srcAddress?: string;
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
    inBridgePort?: string;
    outBridgePort?: string;
}

interface PacketDropParams extends MarkParams{
    packetMark?: string;
    dstAddress?: string;
    dstPort?: string;
}

interface CreateAddressListParams extends MarkParams{
    adressList: string;
    content: string;
}

interface AddNodeToQueueTreeParams{
    name: string;
    parent?: string;
    packetMark?: string;
    priority?: string;
    maxLimit?: string;
    limitAt?: string;
    burstLimit?: string;
    burstThreshold?: string;
    burstTime?: string;
    queueType?: string;
}

interface UpdateNodePriorityParams{
    name: string;
    newPriority: string;
}

const commonServicesToPorts = [
    {
        service: 'email',
        protocol: 'tcp',
        dstPorts: ['25', '587', '465', '110', '995', '143', '993']
    },
    {
        service: 'email',
        protocol: 'udp',
        dstPorts: ['53']
    },
    {
      service: 'web-browsing',
      protocol: 'tcp',
      dstPorts: ['80', '443']
    },
    {
      service: 'web-browsing',
      protocol: 'udp',
      dstPorts: ['53']
    },
    {
      service: 'voip',
      protocol: 'udp',
      dstPorts: ['19302-19309', '3478-3481', '8801-8810','50000-50059' ]
    },
    {
        service: 'voip',
        protocol: 'tcp',
        dstPorts: ['80', '443', '8801', '8802', '50000-50059']
    },
    {
        service: 'file-transfer',
        protocol: 'tcp',
        dstPorts: ['20', '21', '22', '80', '443']
    }, 
    {
        service: 'streaming',
        protocol: 'tcp',
        dstPorts: ['80', '443', '1935']
    },
    {
        service: 'streaming',
        protocol: 'udp',
        dstPorts: ['1935']
    },
] 

const app = express();
const responsePromises = new Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>();
app.use(express.json());


sendConnectionMarksAndPacketMarks();

async function initRabbitMQ(){
    connect(RABBITMQ_URL, (error0: any, conn: any) => {
        if (error0) {
            logger.error('Failed to connect to RabbitMQ:' + error0);
            process.exit(1);
          }
            
          logger.info('Connected to RabbitMQ');
          connection = conn;
          connection.createChannel((error1: any, ch: any) => {
            if (error1) {
                logger.error('Failed to create channel: ' + error1);
                process.exit(1);
            }

            logger.info('Channel created');
            channel = ch;
            channel.assertQueue(REQUEST_QUEUE, {durable: false});
            channel.assertQueue(RESPONSE_QUEUE, {durable: false});
            channel.consume(RESPONSE_QUEUE, (msg: any) => {
                logger.info('Received message: ' + msg.content.toString());
                if(msg != null){
                    const correlationId = msg.properties.correlationId;
                    logger.info('correlationId: ' + correlationId);
                    const responseContent = msg.content.toString();
                    responsePromises.get(correlationId)?.resolve(responseContent);
                    responsePromises.delete(correlationId);
                    channel.ack(msg);
                }
            });              
         });
    });
}

async function sendMessageAndWaitForResponse(msg: any): Promise<any>{
    return new Promise((resolve, reject) => {
        const correlationId = uuidv4();
        responsePromises.set(correlationId, { resolve, reject });
        channel.sendToQueue(REQUEST_QUEUE, Buffer.from(msg),{
            correlationId: correlationId, 
            replyTo: RESPONSE_QUEUE
        });
    });
}

async function sendConnectionMarksAndPacketMarks() {
    const connectionMarkNames = new Set<string>();
    for(let service of commonServicesToPorts){
        const serviceName = service.service;
        const protocol = service.protocol;
        const dstPorts = service.dstPorts;
        const dstPortsString = dstPorts.join(',');
        connectionMarkNames.add(serviceName);
        const connectionMarkParams: ConnectionMarkParams = {
            chain: 'prerouting',
            connectionMark: serviceName,
            protocol: protocol,
            dstPort: dstPortsString,
            passthrough: 'yes'
        }

        const connectionMarkMsg = JSON.stringify(connectionMarkParams);
        const response = await sendMessageAndWaitForResponse(connectionMarkMsg);
        logger.info('sent connection mark: ' + response);
    }

    for(let connectionMark of connectionMarkNames){
        const packetMarkParams: PacketMarkParams = {
            chain: 'prerouting',
            connectionMark: connectionMark,
            packetMark: connectionMark + 'packet',
            passthrough: 'no'
        }

        const packetMarkMsg = JSON.stringify(packetMarkParams);
        const response = await sendMessageAndWaitForResponse(packetMarkMsg);
        logger.info('sent packet mark: ' + response);
    }
}

app.post('/createNewPriorityQueue', authenticateToken, async (req: any, res: any) => {
    try{
        const msg = req.body;

        if(!msg || !msg.priorities){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        const upperTreeMsgParams: AddNodeToQueueTreeParams = {
            name: 'root',
            parent: 'global',
            maxLimit: '100M',
        }

        const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
        const response = await sendMessageAndWaitForResponse(firstQueueTreeMsg);
        
        const user = req.user;
        const routerId = user.routerId;
        const priorities = msg.priorities;
        logger.info('priorities: ' + priorities);
        await dbClient.insertNewPriorities(routerId, priorities);
        for(let priority of priorities){
            const packetMark = priority + '-packet';
            const addNodeToQueueTreeParams: AddNodeToQueueTreeParams = {
                name: 'root',
                packetMark: packetMark,
                priority: (priorities.indexOf(priority) + 1).toString(),
            }

            const msgToPublish = JSON.stringify(addNodeToQueueTreeParams);
            const response = await sendMessageAndWaitForResponse(msgToPublish);
            logger.info('response sent : ' + response);
            
        }
        res.status(200).json({response: "created new priority queue succesfully"});
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
            const updateNodePriority: UpdateNodePriorityParams = {
                name: serviceName,
                newPriority: priority
            }
            
            const msgToPublish = JSON.stringify(updateNodePriority);
            const response = await sendMessageAndWaitForResponse(msgToPublish);
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
            userame: username,
            password: password,
            publicIp: publicIp
        }
        const response = await sendMessageAndWaitForResponse(JSON.stringify(msgToSend));
        logger.info('message: ' + response);
        if(response === 'success'){
            const routerId = dbClient.getRouterId(username);
            const payload = {routerId: routerId};
            const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
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
        const response = await sendMessageAndWaitForResponse(JSON.stringify(msgToPublish));
        logger.info('response to signUp: ' + response);
            if(response === 'success'){
                await dbClient.insertNewUser(username);
                res.status(200).json({response: response});
            }
            else{
                res.status(400).json({response: response});
            }
        }
    
    catch (error) {
        logger.error('An error has occurred: ' + error);
        res.status(500).json({error: 'An error has occurred ' + error});
    }
});

app.post('/logout', async (req, res) => {
    await publisher.publish('logout');
});

app.post('/blockService', authenticateToken, async (req: any, res: any) => {
});

async function authenticateToken(req: any, res: any, next: any){
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





