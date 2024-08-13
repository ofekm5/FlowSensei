import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import logger from '../logger';
import apiClient from './APIClient'; 

const exchange = 'requests_exchange';
const rabbitMqUrl = 'amqp://myuser:mypass@localhost:5672';

function processMessage(message: string): string {
    let responseMessage = { Status: 'failed' };

    try {
        const parsedMessage = JSON.parse(message);
        const { Type } = parsedMessage;
        
        if (Type){
            switch (Type) {
                case "login":
                    const { Host, Username, Password, RouterID } = parsedMessage;
                    if (Host && Username && Password && RouterID) {
                        apiClient.login(Host, Username, Password, RouterID)
                            .then(() => {
                                responseMessage.Status = 'ok';
                            })
                            .catch((error) => {
                                logger.error(`Failed to login: ${error}`);
                            });
                    } 
                    else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "markConnection":
                    const {
                        chain,
                        connectionMark,
                        passthrough,
                        protocol,
                        inInterface,
                        outInterface,
                        inBridgePort,
                        outBridgePort,
                        ports,
                        srcAddress,
                        dstAddress,
                        srcPort
                    } = parsedMessage;
                    if (chain && passthrough && protocol) {
                        apiClient.markConnection(connectionMark, protocol, srcPort, dstPort, srcAddress, dstAddress)
                            .then(() => {
                                responseMessage.Status = 'ok';
                            })
                            .catch((error) => {
                                logger.error(`Failed to mark connection: ${error}`);
                            });
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "markPacket":
                    const {
                        chain: mpChain,
                        connectionMark: mpConnectionMark,
                        passthrough: mpPassthrough,
                        protocol: mpProtocol,
                        inInterface: mpInInterface,
                        outInterface: mpOutInterface,
                        inBridgePort: mpInBridgePort,
                        outBridgePort: mpOutBridgePort,
                        srcAddress: mpSrcAddress,
                        packetMark,
                        dstAddress: mpDstAddress,
                        srcPort: mpSrcPort,
                        dstPort: mpDstPort
                    } = parsedMessage;
                    if (mpChain) {
                        // TODO: use apiClient for API call
                        responseMessage.Status = 'ok';
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "dropPacket":
                    const {
                        chain: dpChain,
                        connectionMark: dpConnectionMark,
                        passthrough: dpPassthrough,
                        protocol: dpProtocol,
                        inInterface: dpInInterface,
                        outInterface: dpOutInterface,
                        srcAddress: dpSrcAddress,
                        srcPort: dpSrcPort,
                        dstAddress: dpDstAddress,
                        packetMark: dpPacketMark,
                        dstPort: dpDstPort
                    } = parsedMessage;
                    if (dpChain) {
                        // TODO: use apiClient for API call
                        responseMessage.Status = 'ok';
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "addNodeToQueueTree":
                    const {
                        name,
                        parent,
                        packetMark: anPacketMark,
                        priority,
                        maxLimit,
                        limitAt,
                        burstLimit,
                        burstThreshold,
                        burstTime,
                        queueType
                    } = parsedMessage;
                    if (name && parent && anPacketMark && priority && maxLimit && limitAt && burstLimit && burstThreshold && burstTime && queueType) {
                        // TODO: use apiClient for API call
                        responseMessage.Status = 'ok';
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "updateNodePriority":
                    const { name: unpName, newPriority } = parsedMessage;
                    if (unpName && newPriority) {
                        // TODO: use apiClient for API call
                        responseMessage.Status = 'ok';
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                case "disconnect":
                    const { RouterID: discRouterID } = parsedMessage;
                    if (discRouterID) {
                        // TODO: use apiClient for API call
                        responseMessage.Status = 'ok';
                    } else {
                        logger.error('Message missing required fields');
                    }
                    break;
                default:
                    logger.error('Invalid message type');
                    break;
            }
        }
        else{
            logger.error('message type do not exist');
        }
    } 
    catch (error) {
        logger.error(`Error processing message: ${error}`);
    }

    return JSON.stringify(responseMessage);
}

const initMQTransport = () => {
    amqp.connect(rabbitMqUrl, (error0: any, connection: Connection) => {
        if (error0) {
            logger.error(`Connection error: ${error0}`);
            setTimeout(initMQTransport, 5000); 
            return;
        }

        connection.createChannel((error1: any, channel: Channel) => {
            if (error1) {
                logger.error(`Channel error: ${error1}`);
                connection.close();
                setTimeout(initMQTransport, 5000); 
                return;
            }

            channel.assertExchange(exchange, 'direct', { durable: false });
            channel.assertQueue('queue', { durable: false }, (error2: any, q: amqp.Replies.AssertQueue) => {
                if (error2) {
                    logger.error(`Queue assertion error: ${error2}`);
                    channel.close(() => {});
                    connection.close(() => {});
                    setTimeout(initMQTransport, 5000); 
                    return;
                }

                channel.bindQueue(q.queue, exchange, 'request_key');

                channel.prefetch(1); 
                logger.info(' [x] Awaiting RPC requests');

                channel.consume(q.queue, (msg: Message | null) => {
                    if (msg) {
                        const messageContent = msg.content.toString();
                        logger.info(` [.] Received ${messageContent}`);

                        const response = processMessage(messageContent);
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
            setTimeout(initMQTransport, 5000); 
        });

        connection.on('close', () => {
            logger.info('Connection closed, retrying...');
            setTimeout(initMQTransport, 5000); 
        });
    });
}

export default initMQTransport;
