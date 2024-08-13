import logger from "../logger";
import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import { v4 as uuidv4 } from 'uuid';

interface markServiceParams {
    service: string;
    protocol: string;
    dstPort: string;
    srcPort?: string;
    srcAddress?: string;
    dstAddress?: string;
}

interface AddNodeToQueueTreeParams {
    name: string;
    parent: string;
    packetMark: string;
    priority: string;
    maxLimit: string;
    limitAt: string;
    burstLimit: string;
    burstThreshold: string;
    burstTime: string;
    queueType: string;
}

const responsePromises = new Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>();
const RABBITMQ_URL = 'amqp://localhost';
const exchange = 'requests_exchange';
let channel: Channel;
let responseQueue: string;

export function initRabbitMQ(){
    amqp.connect(RABBITMQ_URL, (error0: any, conn: Connection) => {
        if (error0) {
            logger.error('Failed to connect to RabbitMQ:' + error0);
            process.exit(1);
        }
            
        logger.info('Connected to RabbitMQ');
        conn.createChannel((error1: any, ch: Channel) => {
            if (error1) {
                logger.error('Failed to create channel: ' + error1);
                process.exit(1);
            }

            channel = ch;

            channel.assertExchange(exchange, 'direct', { durable: false });
            channel.assertQueue('', { exclusive: true }, (error2: any, q: amqp.Replies.AssertQueue) => {
                if (error2) {
                    throw error2;
                }

                responseQueue = q.queue;

                channel.consume(responseQueue, (msg: Message | null) => {
                    if (msg){
                        const correlationId = msg.properties.correlationId;
                        logger.info(`Received message: ${msg.content.toString()} with correlationId: ${correlationId}`);
                        const responseContent = msg.content.toString();
                        responsePromises.get(correlationId)?.resolve(responseContent);
                        responsePromises.delete(correlationId);
                        channel.ack(msg);
                    }       
                });
            });
        });
    });
    
}

export function sendMessageToQueue(msg: any): Promise<any>{
    return new Promise((resolve, reject) => {
        if (!channel) {
            return reject(new Error('Channel is not initialized'));
        }

        const correlationId = uuidv4();
        responsePromises.set(correlationId, { resolve, reject });
        channel.sendToQueue(exchange, Buffer.from(msg),{
            correlationId: correlationId, 
            replyTo: responseQueue
        });
    });
}

export async function markService() {
    const connectionMarkNames = new Set<string>();
    for(let service of commonServicesToPorts){
        const serviceName = service.service;
        const protocol = service.protocol;
        const dstPorts = service.dstPorts;
        const dstPortsString = dstPorts.join(',');
        connectionMarkNames.add(serviceName);
        const connectionMarkParams: ConnectionMarkParams = {
            type: 'connection-mark',
            chain: 'prerouting',
            connectionMark: serviceName,
            protocol: protocol,
            dstPort: dstPortsString,
            passthrough: 'yes'
        }

        const connectionMarkMsg = JSON.stringify(connectionMarkParams);
        const response = await sendMessageToQueue(connectionMarkMsg);
        logger.info('sent connection mark: ' + response);
    }

    for(let connectionMark of connectionMarkNames){
        const packetMarkParams: PacketMarkParams = {
            type: 'packet-mark',
            chain: 'prerouting',
            connectionMark: connectionMark,
            packetMark: connectionMark + 'packet',
            passthrough: 'no'
        }

        const packetMarkMsg = JSON.stringify(packetMarkParams);
        const response = await sendMessageToQueue(packetMarkMsg);
        logger.info('sent packet mark: ' + response);
    }

    return "marked connections and packets succesfully";
}

export async function createNewPriorityQueue(priorities: any){
    const upperTreeMsgParams: AddNodeToQueueTreeParams = {
        type: 'queue-tree',
        name: 'root',
        parent: 'global',
        maxLimit: '100M',
    }

    const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
    const response = await sendMessageToQueue(firstQueueTreeMsg);
    logger.info('sent upper tree: ' + response);
    logger.info('priorities: ' + priorities);

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

    return "created new priority queue succesfully";
}

export async function updateNodesPriority(serviceName: string, newPriority: string){
    const updateNodePriority: UpdateNodePriorityParams = {
        type: 'update-node-priority',
        name: serviceName,
        newPriority: newPriority
    }
    
    const msgToPublish = JSON.stringify(updateNodePriority);
    const response = await sendMessageToQueue(msgToPublish);
    return response;
}

export async function login(username: string, password: string, publicIp: string, routerID:string){
    const msgToSend = {
        type: 'login',
        username: username,
        password: password,
        publicIp: publicIp,
        routerID: routerID
    }

    const response = await sendMessageToQueue(JSON.stringify(msgToSend));
    return response;
}

export async function logout(){
    const msgToSend = {
        type: 'logout'
    }

    const response = await sendMessageToQueue(JSON.stringify(msgToSend));
    return response;
}