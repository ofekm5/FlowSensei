import logger from "../logger";
import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import { v4 as uuidv4 } from 'uuid';

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

