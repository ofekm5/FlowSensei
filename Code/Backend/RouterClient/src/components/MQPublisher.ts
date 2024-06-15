import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import logger from './logger';
import apiClient from './APIClient';

const exchange = 'requests_exchange';
const queue = 'server_queue';
const rabbitMqUrl = 'amqp://myuser:mypass@localhost:5672';

const initMQTransport = () => {
    amqp.connect(rabbitMqUrl, (error0: any, connection: Connection) => {
        if (error0) {
            logger.error(`Connection error: ${error0}`);
            setTimeout(initMQTransport, 5000); // Try to reconnect after 5 seconds
            return;
        }
        connection.createChannel((error1: any, channel: Channel) => {
            if (error1) {
                logger.error(`Channel error: ${error1}`);
                connection.close();
                setTimeout(initMQTransport, 5000); // Try to reconnect after 5 seconds
                return;
            }

            channel.assertExchange(exchange, 'direct', { durable: false });

            // Create a queue for server requests and bind it to the exchange
            channel.assertQueue(queue, { durable: false }, (error2: any, q: amqp.Replies.AssertQueue) => {
                if (error2) {
                    logger.error(`Queue assertion error: ${error2}`);
                    channel.close(() => {}); 
                    connection.close(() => {}); 
                    setTimeout(initMQTransport, 5000); // Try to reconnect after 5 seconds
                    return;
                }

                channel.bindQueue(q.queue, exchange, 'request_key');

                channel.prefetch(1); // Process one message at a time
                logger.info(' [x] Awaiting RPC requests');

                channel.consume(q.queue, (msg: Message | null) => {
                    if (!msg) {
                        return;
                    }

                    const n = msg.content.toString();
                    logger.info(` [.] Received %s", ${n}`);

                    const response = `Processed: ${n}`;

                    // Send the response to the appropriate response queue
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(response), {
                        correlationId: msg.properties.correlationId
                    });

                    channel.ack(msg); // Acknowledge the message as processed
                });
            });
        });

        connection.on('error', (err) => {
            logger.error(`Connection error: ${err}`);
            setTimeout(initMQTransport, 5000); // Try to reconnect after 5 seconds
        });

        connection.on('close', () => {
            logger.info('Connection closed, retrying...');
            setTimeout(initMQTransport, 5000); // Try to reconnect after 5 seconds
        });
    });
}

export default initMQTransport;
