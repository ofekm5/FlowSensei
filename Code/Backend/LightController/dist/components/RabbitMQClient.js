"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const logger_1 = __importDefault(require("../logger"));
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const uuid_1 = require("uuid");
class RabbitMQClient {
    constructor(i_RabbitURL, i_Exchange) {
        this.responsePromises = new Map();
        this.rabbitURL = i_RabbitURL;
        this.exchange = i_Exchange;
        callback_api_1.default.connect(this.rabbitURL, (error0, conn) => {
            if (error0) {
                logger_1.default.error('Failed to connect to RabbitMQ:' + error0);
                process.exit(1);
            }
            logger_1.default.info('Connected to RabbitMQ');
            conn.createChannel((error1, ch) => {
                if (error1) {
                    logger_1.default.error('Failed to create channel: ' + error1);
                    process.exit(1);
                }
                this.channel = ch;
                this.channel.assertExchange(this.exchange, 'direct', { durable: false });
                this.channel.assertQueue('', { exclusive: true }, (error2, q) => {
                    if (error2) {
                        throw error2;
                    }
                    this.responseQueue = q.queue;
                    this.channel.consume(this.responseQueue, (msg) => {
                        var _a;
                        if (msg) {
                            const correlationId = msg.properties.correlationId;
                            logger_1.default.info(`Received message: ${msg.content.toString()} with correlationId: ${correlationId}`);
                            const responseContent = msg.content.toString();
                            (_a = this.responsePromises.get(correlationId)) === null || _a === void 0 ? void 0 : _a.resolve(responseContent);
                            this.responsePromises.delete(correlationId);
                            this.channel.ack(msg);
                        }
                    });
                });
            });
        });
    }
    sendMessageToQueue(msg) {
        return new Promise((resolve, reject) => {
            if (!this.channel) {
                return reject(new Error('Channel is not initialized'));
            }
            const correlationId = (0, uuid_1.v4)();
            this.responsePromises.set(correlationId, { resolve, reject });
            this.channel.sendToQueue(this.exchange, Buffer.from(msg), {
                correlationId: correlationId,
                replyTo: this.responseQueue
            });
        });
    }
    async markService(commonServicesToPorts) {
        const connectionMarkNames = new Set();
        for (let service of commonServicesToPorts) {
            const serviceName = service.service;
            const protocol = service.protocol;
            const dstPorts = service.dstPorts;
            const dstPortsString = dstPorts.join(',');
            connectionMarkNames.add(serviceName);
            const connectionMarkParams = {
                service: serviceName,
                protocol: protocol,
                dstPort: dstPortsString
            };
            const connectionMarkMsg = JSON.stringify(connectionMarkParams);
            const response = await this.sendMessageToQueue(connectionMarkMsg);
            logger_1.default.info('sent connection mark: ' + response);
        }
        for (let connectionMark of connectionMarkNames) {
            const packetMarkParams = {
                service: connectionMark,
                protocol: 'prerouting',
                dstPort: connectionMark + 'packet'
            };
            const packetMarkMsg = JSON.stringify(packetMarkParams);
            const response = await this.sendMessageToQueue(packetMarkMsg);
            logger_1.default.info('sent packet mark: ' + response);
        }
        return "marked connections and packets successfully";
    }
    async createNewPriorityQueue(priorities) {
        const upperTreeMsgParams = {
            name: 'root',
            parent: 'global',
            packetMark: '',
            priority: ''
        };
        const firstQueueTreeMsg = JSON.stringify(upperTreeMsgParams);
        const response = await this.sendMessageToQueue(firstQueueTreeMsg);
        logger_1.default.info('sent upper tree: ' + response);
        logger_1.default.info('priorities: ' + priorities);
        for (let priority of priorities) {
            const packetMark = priority + '-packet';
            const addNodeToQueueTreeParams = {
                name: 'root',
                parent: 'global',
                packetMark: packetMark,
                priority: (priorities.indexOf(priority) + 1).toString()
            };
            const msgToPublish = JSON.stringify(addNodeToQueueTreeParams);
            const response = await this.sendMessageToQueue(msgToPublish);
            logger_1.default.info('response sent : ' + response);
        }
        return "created new priority queue successfully";
    }
    async updateNodesPriority(serviceName, newPriority) {
        const updateNodePriority = {
            type: 'update-node-priority',
            name: serviceName,
            newPriority: newPriority
        };
        const msgToPublish = JSON.stringify(updateNodePriority);
        const response = await this.sendMessageToQueue(msgToPublish);
        return response;
    }
    async deleteNode(routerID, serviceName) {
        const deleteNode = {
            type: 'deleteNodeFromGlobalQueue',
            routerID: routerID,
            name: serviceName
        };
        const response = await this.sendMessageToQueue(deleteNode);
        return response;
    }
    async login(username, password, publicIp, routerID) {
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
    async logout() {
        const msgToSend = {
            type: 'logout'
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend));
        return response;
    }
}
exports.RabbitMQClient = RabbitMQClient;
