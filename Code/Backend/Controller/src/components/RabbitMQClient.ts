import logger from "../logger";
import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import { v4 as uuidv4 } from 'uuid';

interface IService {
    service: string;
    protocol: string;
    dstPort: string;
    srcPort?: string;
    srcAddress?: string;
    dstAddress?: string;
}

interface INode {
    name: string;
    parent: string;
    packetMark: string;
    priority: string;
}

export class RabbitMQClient {
    private responsePromises = new Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>();
    private channel!: Channel;
    private responseQueue!: string;
    private rabbitURL:string;
    private exchange:string;
    

    public constructor(i_RabbitURL:string, i_Exchange:string) {
        this.rabbitURL = i_RabbitURL;
        this.exchange = i_Exchange;
        amqp.connect(this.rabbitURL, (error0: any, conn: Connection) => {
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

                this.channel = ch;

                this.channel.assertExchange(this.exchange, 'direct', { durable: false });
                this.channel.assertQueue('', { exclusive: true }, (error2: any, q: amqp.Replies.AssertQueue) => {
                    if (error2) {
                        throw error2;
                    }

                    this.responseQueue = q.queue;

                    this.channel.consume(this.responseQueue, (msg: Message | null) => {
                        if (msg){
                            const correlationId = msg.properties.correlationId;
                            logger.info(`Received message: ${msg.content.toString()} with correlationId: ${correlationId}`);
                            const responseContent = msg.content.toString();
                            this.responsePromises.get(correlationId)?.resolve(responseContent);
                            this.responsePromises.delete(correlationId);
                            this.channel.ack(msg);
                        }       
                    });
                });
            });
        });
    }

    private sendMessageToQueue(msg: string, type: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.channel) {
                return reject(new Error('Channel is not initialized'));
            }

            const correlationId = uuidv4();
            this.responsePromises.set(correlationId, { resolve, reject });
            this.channel.sendToQueue(this.exchange, Buffer.from(msg), {
                correlationId: correlationId, 
                replyTo: this.responseQueue
            });
            logger.info(`Sent ${type} message: ${msg} with correlationId: ${correlationId}`);
        });
    }

    public async markService(service: IService) {
        const msgToSend: {
            type: string;
            service: string;
            protocol: string;
            dstPorts: string;
            srcPort?: string;      
            srcAddress?: string;   
            dstAddress?: string;   
        } = {
            type: 'markService',
            service: service.service,
            protocol: service.protocol,
            dstPorts: service.dstPort
        };
    
        if (service.srcPort) {
            msgToSend.srcPort = service.srcPort;
        }
        if (service.srcAddress) {
            msgToSend.srcAddress = service.srcAddress;
        }
        if (service.dstAddress) {
            msgToSend.dstAddress = service.dstAddress;
        }
    
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'updateNodePriority');
        return response;
    }
    

    public async addNodeToQueueTree(node: INode) {
        const msgToSend = {
            type: 'updateNodePriority',
            name: node.name,
            parent: node.parent,
            packetMark: node.packetMark,
            priority: node.priority,
        };
        
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'updateNodePriority');
        return response;
    }

    public async updateNodePriority(serviceName: string, newPriority: string) {
        const msgToSend = {
            type: 'updateNodePriority',
            name: serviceName,
            newPriority: newPriority
        };

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'updateNodePriority');
        return response;
    }

    public async deleteNode(routerID:string, serviceName: string) {
        const msgToSend = {
            type: 'deleteNodeFromGlobalQueue',
            routerID: routerID,
            name: serviceName
        };

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'deleteNodeFromGlobalQueue');
        return response;
    }

    public async login(username: string, password: string, publicIp: string, routerID:string) {
        const msgToSend = {
            type: 'login',
            username: username,
            password: password,
            publicIp: publicIp,
            routerID: routerID
        };

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'login');
        return response;
    }

    public async disconnect(routerID: string) {
        const msgToSend = {
            type: 'disconnect',
            routerID: routerID
        };

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'disconnect');
        return response;
    }
}
