import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import logger from '../logger';
import apiClient from './APIClient';

interface ResponseMessage {
    Status: string;
    Error?: string; 
}

class MessageProcessor {
    public ConnectToRabbit(rabbitMqUrl: string, exchange: string) {
        amqp.connect(rabbitMqUrl, (error0: any, connection: Connection) => {
            if (error0) {
                logger.error(`Connection error: ${error0}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000); 
                return;
            }

            connection.createChannel((error1: any, channel: Channel) => {
                if (error1) {
                    logger.error(`Channel error: ${error1}`);
                    connection.close();
                    setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000); 
                    return;
                }

                channel.assertExchange(exchange, 'direct', { durable: false });
                channel.assertQueue('queue', { durable: false }, (error2: any, q: amqp.Replies.AssertQueue) => {
                    if (error2) {
                        logger.error(`Queue assertion error: ${error2}`);
                        channel.close(() => {});
                        connection.close(() => {});
                        setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000); 
                        return;
                    }

                    channel.bindQueue(q.queue, exchange, 'request_key');

                    channel.prefetch(1); 
                    logger.info(' [x] Awaiting RPC requests');

                    channel.consume(q.queue, async (msg: Message | null) => {
                        if (msg) {
                            const messageContent = msg.content.toString();
                            logger.info(` [.] Received ${messageContent}`);
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
                logger.error(`Connection error: ${err}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000); 
            });

            connection.on('close', () => {
                logger.info('Connection closed, retrying...');
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000); 
            });
        });
    }

    private async processMessage(message: string): Promise<string> {
        let responseMessage: ResponseMessage = { Status: 'failed' };

        try {
            const parsedMessage = JSON.parse(message);
            const { Type } = parsedMessage;

            if (Type) {
                switch (Type) {
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
                        await apiClient.deleteNodeFromGlobalQueue(parsedMessage.RouterID, parsedMessage.name)
                            .catch((error: any) => {
                                throw new Error(`Failed to delete node from global queue: ${error}`);
                            });
                        responseMessage.Status = 'ok';
                        break;
                    default:
                        logger.error('Invalid message type');
                        break;
                }
            } 
            else {
                logger.error('Message type does not exist');
            }
        } 
        catch (error) {
            responseMessage.Status = 'failed';
            responseMessage.Error = `Error processing message: ${error instanceof Error ? error.message : error}`;
            logger.error(`Error processing message: ${error}`);
        }

        return JSON.stringify(responseMessage);
    }

    private async handleLogin(parsedMessage: any): Promise<void> {
        const { Host, Username, Password, RouterID } = parsedMessage;
        if (Host && Username && Password && RouterID) {
            await apiClient.login(Host, Username, Password, RouterID)
                .catch((error: any) => {
                    throw new Error(`Failed to login: ${error}`);
                });
        } 
        else {
            throw new Error('Missing required fields for login');
        }
    }

    private async handleMarkService(parsedMessage: any): Promise<void> {
        const {
            service,
            protocol,
            dstPort,
            srcPort,
            srcAddress,
            dstAddress
        } = parsedMessage;
        if (service && protocol && dstPort) {
            await apiClient.markService(parsedMessage.RouterID, {
                service,
                protocol,
                dstPort,
                srcPort,
                srcAddress,
                dstAddress
            })
            .catch((error: any) => {
                throw (`Failed to mark service: ${error}`);;
            });
        } 
        else {
            throw new Error('Missing required fields for markService');
        }
    }

    private async handleAddNodeToQueueTree(parsedMessage: any): Promise<void> {
        const {
            name,
            parent,
            packetMark,
            priority,
        } = parsedMessage;
        if (name && parent && packetMark && priority) {
            await apiClient.addNodeToQueueTree(parsedMessage.RouterID, {
                name,
                parent,
                packetMark,
                priority,
            })
            .catch((error: any) => {
                throw new Error(`Failed to add node to queue tree: ${error}`);
            });
        } 
        else {
            throw new Error('Missing required fields for addNodeToQueueTree');
        }
    }

    private async handleUpdateNodePriority(parsedMessage: any): Promise<void> {
        const { name, newPriority, RouterID } = parsedMessage;
        if (name && newPriority && RouterID) {
            await apiClient.updateNodePriority(RouterID, name, newPriority)
                .catch((error: any) => {
                    throw new Error(`Failed to update node priority: ${error}`);
                });
        } 
        else {
            throw new Error('Missing required fields for updateNodePriority');
        }
    }

    private async handleDisconnect(parsedMessage: any): Promise<void> {
        const { RouterID } = parsedMessage;
        if (RouterID) {
            await apiClient.disconnect(RouterID)
                .catch((error: any) => {
                    throw new Error(`Failed to disconnect: ${error}`);
                });
        } 
        else {
            throw new Error('Missing required fields for disconnect');
        }
    }
}

export default MessageProcessor;
