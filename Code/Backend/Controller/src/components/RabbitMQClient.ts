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

    public sendMessageToQueue(msg: any): Promise<any> {
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
        });
    }

    public async markService(commonServicesToPorts: any[]) {
        const connectionMarkNames = new Set<string>();
        for (let service of commonServicesToPorts) {
            const serviceName = service.service;
            const protocol = service.protocol;
            const dstPorts = service.dstPorts;
            const dstPortsString = dstPorts.join(',');
            connectionMarkNames.add(serviceName);
            const connectionMarkParams: markServiceParams = {
                service: serviceName,
                protocol: protocol,
                dstPort: dstPortsString
            };

            const connectionMarkMsg = JSON.stringify(connectionMarkParams);
            const response = await this.sendMessageToQueue(connectionMarkMsg);
            logger.info('sent connection mark: ' + response);
        }

        for (let connectionMark of connectionMarkNames) {
            const packetMarkParams: markServiceParams = {
                service: connectionMark,
                protocol: 'prerouting',
                dstPort: connectionMark + 'packet'
            };

            const packetMarkMsg = JSON.stringify(packetMarkParams);
            const response = await this.sendMessageToQueue(packetMarkMsg);
            logger.info('sent packet mark: ' + response);
        }

        return "marked connections and packets successfully";
    }

    public async createNewPriorityQueue(priorities: any[]) {
        const upperTreeMsgParams: AddNodeToQueueTreeParams = {
            name: 'root',
            parent: 'global',
            packetMark: '',
            priority: ''
        };
        service,
        protocol,
        dstPort,
        srcPort,
        srcAddress,
        dstAddress

        const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
        const response = await this.sendMessageToQueue(firstQueueTreeMsg);
        logger.info('sent upper tree: ' + response);
        logger.info('priorities: ' + priorities);

        for (let priority of priorities) {
            const packetMark = priority + '-packet';
            const addNodeToQueueTreeParams: AddNodeToQueueTreeParams = {
                name: 'root',
                parent: 'global',
                packetMark: packetMark,
                priority: (priorities.indexOf(priority) + 1).toString()
            };

            const msgToPublish = JSON.stringify(addNodeToQueueTreeParams);
            const response = await this.sendMessageToQueue(msgToPublish);
            logger.info('response sent : ' + response);
        }

        return "created new priority queue successfully";
    }

    public async updateNodesPriority(serviceName: string, newPriority: string) {
        const updateNodePriority = {
            type: 'update-node-priority',
            name: serviceName,
            newPriority: newPriority
        };
        
        const msgToPublish = JSON.stringify(updateNodePriority);
        const response = await this.sendMessageToQueue(msgToPublish);
        return response;
    }

    public async deleteNode(routerID:string, serviceName: string) {

        const deleteNode = {
            type: 'deleteNodeFromGlobalQueue',
            routerID: routerID,
            name: serviceName
        };
        const response = await this.sendMessageToQueue(deleteNode);
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

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend));
        return response;
    }

    public async logout(routerID: string) {
        const msgToSend = {
            type: 'logout',
            routerID: routerID
        };

        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend));
        return response;
    }
}
