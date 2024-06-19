import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import logger from './logger';
import apiClient from './APIClient'; 

const exchange = 'requests_exchange';
const queue = 'server_queue';
const rabbitMqUrl = 'amqp://myuser:mypass@localhost:5672';

function processMessage(message: string): string {
    let responseMessage = { Status: 'failed' };

    try {
        const parsedMessage = JSON.parse(message);

        const { Type, Host, Username, Password, RouterID } = parsedMessage;

        if (Type && Host && Username && Password && RouterID) {
            responseMessage.Status = 'ok';
        } else {
            logger.error('Message missing required fields');
        }
    } catch (error) {
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
            channel.assertQueue(queue, { durable: false }, (error2: any, q: amqp.Replies.AssertQueue) => {
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
                    if (!msg) {
                        return;
                    }

                    const messageContent = msg.content.toString();
                    logger.info(` [.] Received ${messageContent}`);

                    const response = processMessage(messageContent);
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(response), {
                        correlationId: msg.properties.correlationId
                    });

                    channel.ack(msg);
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
