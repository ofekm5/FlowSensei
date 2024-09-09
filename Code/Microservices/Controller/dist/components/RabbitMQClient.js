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
    sendMessageToQueue(msg, type) {
        return new Promise((resolve, reject) => {
            if (!this.channel) {
                return reject(new Error('Channel is not initialized'));
            }
            const correlationId = (0, uuid_1.v4)();
            this.responsePromises.set(correlationId, { resolve, reject });
            this.channel.publish(this.exchange, 'request_key', Buffer.from(msg), {
                correlationId: correlationId,
                replyTo: this.responseQueue
            });
            logger_1.default.info(`Sent ${type} message: ${msg} with correlationId: ${correlationId}`);
        });
    }
    async fetchKibana(routerIP) {
        const msgToSend = {
            type: 'elkSetup',
            routerIP: routerIP
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'elkSetup');
        return response;
    }
    async markService(service, routerID) {
        const msgToSend = {
            type: 'markService',
            routerID: routerID,
            service: service.name,
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
    async addNodeToQueueTree(node, routerID) {
        const msgToSend = {
            type: 'updateNodePriority',
            routerID: routerID,
            parent: node.parent,
            serviceName: node.serviceName,
            priority: node.priority,
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'updateNodePriority');
        return response;
    }
    async updateNodePriority(routerId, serviceName, newPriority) {
        const msgToSend = {
            type: 'updateNodePriority',
            routerID: routerId,
            serviceName: serviceName,
            newPriority: newPriority
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'updateNodePriority');
        return response;
    }
    async deleteNode(routerID, serviceName) {
        const msgToSend = {
            type: 'deleteNodeFromGlobalQueue',
            routerID: routerID,
            name: serviceName
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'deleteNodeFromGlobalQueue');
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
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'login');
        return response;
    }
    async disconnect(routerID) {
        const msgToSend = {
            type: 'disconnect',
            routerID: routerID
        };
        const response = await this.sendMessageToQueue(JSON.stringify(msgToSend), 'disconnect');
        return response;
    }
}
exports.RabbitMQClient = RabbitMQClient;
