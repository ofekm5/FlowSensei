"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const logger_1 = __importDefault(require("../logger"));
const APIClient_1 = __importDefault(require("./APIClient"));
class MessageProcessor {
    ConnectToRabbit(rabbitMqUrl, exchange) {
        callback_api_1.default.connect(rabbitMqUrl, (error0, connection) => {
            if (error0) {
                logger_1.default.error(`Connection error: ${error0}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                return;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    logger_1.default.error(`Channel error: ${error1}`);
                    connection.close();
                    setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                    return;
                }
                channel.assertExchange(exchange, 'direct', { durable: false });
                channel.assertQueue('queue', { durable: false }, (error2, q) => {
                    if (error2) {
                        logger_1.default.error(`Queue assertion error: ${error2}`);
                        channel.close(() => { });
                        connection.close(() => { });
                        setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                        return;
                    }
                    channel.bindQueue(q.queue, exchange, 'request_key');
                    channel.prefetch(1);
                    logger_1.default.info(' [x] Awaiting RPC requests');
                    channel.consume(q.queue, async (msg) => {
                        if (msg) {
                            const messageContent = msg.content.toString();
                            logger_1.default.info(` [.] Received ${messageContent}`);
                            const response = await this.processMessage(messageContent);
                            channel.sendToQueue(msg.properties.replyTo, Buffer.from(response), {
                                correlationId: msg.properties.correlationId
                            });
                            channel.ack(msg);
                        }
                    });
                });
            });
            connection.on('error', (err) => {
                logger_1.default.error(`Connection error: ${err}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
            });
            connection.on('close', () => {
                logger_1.default.info('Connection closed, retrying...');
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
            });
        });
    }
    async processMessage(message) {
        let responseMessage = { Status: 'failed' };
        try {
            const parsedMessage = JSON.parse(message);
            const { type } = parsedMessage;
            if (type) {
                switch (type) {
                    case "login":
                        await this.handleLogin(parsedMessage);
                        responseMessage.Status = 'ok';
                        break;
                    case "markService":
                        await this.handleMarkService(parsedMessage);
                        responseMessage.Status = 'ok';
                        break;
                    case "addNodeToQueueTree":
                        await this.handleAddNodeToQueueTree(parsedMessage);
                        responseMessage.Status = 'ok';
                        break;
                    case "updateNodePriority":
                        await this.handleUpdateNodePriority(parsedMessage);
                        responseMessage.Status = 'ok';
                        break;
                    case "disconnect":
                        await this.handleDisconnect(parsedMessage);
                        responseMessage.Status = 'ok';
                        break;
                    case "deleteNodeFromGlobalQueue":
                        await APIClient_1.default.deleteNodeFromGlobalQueue(parsedMessage.routerID, parsedMessage.serviceName)
                            .catch((error) => {
                            throw new Error(`Failed to delete node from global queue: ${error}`);
                        });
                        responseMessage.Status = 'ok';
                        break;
                    default:
                        logger_1.default.error('Invalid message type');
                        break;
                }
            }
            else {
                logger_1.default.error('Message type does not exist');
            }
        }
        catch (error) {
            responseMessage.Status = 'failed';
            responseMessage.Error = `Error processing message: ${error instanceof Error ? error.message : error}`;
            logger_1.default.error(`Error processing message: ${error}`);
        }
        return JSON.stringify(responseMessage);
    }
    async handleLogin(parsedMessage) {
        const { Host, Username, Password, routerID } = parsedMessage;
        if (Host && Username && Password && routerID) {
            await APIClient_1.default.login(Host, Username, Password, routerID)
                .catch((error) => {
                throw new Error(`Failed to login: ${error}`);
            });
        }
        else {
            throw new Error('Missing required fields for login');
        }
    }
    async handleMarkService(parsedMessage) {
        const { service, protocol, dstPort, srcPort, srcAddress, dstAddress } = parsedMessage;
        if (service && protocol && dstPort) {
            await APIClient_1.default.markService(parsedMessage.routerID, {
                service,
                protocol,
                dstPort,
                srcPort,
                srcAddress,
                dstAddress
            })
                .catch((error) => {
                throw (`Failed to mark service: ${error}`);
                ;
            });
        }
        else {
            throw new Error('Missing required fields for markService');
        }
    }
    async handleAddNodeToQueueTree(parsedMessage) {
        const { parent, serviceName, priority, } = parsedMessage;
        const packetMark = serviceName + '_packet';
        if (parent && serviceName && priority) {
            await APIClient_1.default.addNodeToQueueTree(parsedMessage.routerID, {
                serviceName,
                parent,
                packetMark,
                priority,
            })
                .catch((error) => {
                throw new Error(`Failed to add node to queue tree: ${error}`);
            });
        }
        else {
            throw new Error('Missing required fields for addNodeToQueueTree');
        }
    }
    async handleUpdateNodePriority(parsedMessage) {
        const { name, newPriority, routerID } = parsedMessage;
        if (name && newPriority && routerID) {
            await APIClient_1.default.updateNodePriority(routerID, name, newPriority)
                .catch((error) => {
                throw new Error(`Failed to update node priority: ${error}`);
            });
        }
        else {
            throw new Error('Missing required fields for updateNodePriority');
        }
    }
    async handleDisconnect(parsedMessage) {
        const { routerID } = parsedMessage;
        if (routerID) {
            await APIClient_1.default.disconnect(routerID)
                .catch((error) => {
                throw new Error(`Failed to disconnect: ${error}`);
            });
        }
        else {
            throw new Error('Missing required fields for disconnect');
        }
    }
}
exports.default = MessageProcessor;
