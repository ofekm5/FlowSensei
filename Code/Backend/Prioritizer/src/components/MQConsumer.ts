import {connect} from 'amqplib';
import logger from '../logger';
import { EventEmitter } from 'events';
//amqp://myuser:mypass@localhost:5672
//amqp://myuser:mypass@localhost:5673

class MQConsumer {
    private connection!: any;
    private channel!: any;
    private brokerURL:string; 
    private queueName:string;
    public events: EventEmitter;

    constructor(i_BrokerURL:string='amqp://myuser:mypass@localhost:5672', i_QueueName:string='response_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
        this.events = new EventEmitter();
    }

    public async initConsumer() {
        try {
            this.connection = await connect(this.brokerURL);
            logger.info('Connected to RabbitMQ server: ' + this.brokerURL);
            this.channel = await this.connection.createChannel();
            logger.info('Channel created' + this.channel);
            await this.channel.assertQueue(this.queueName, {durable: false});
            logger.info('Queue created: ' + this.queueName);
        } 
        catch (error) {
            logger.error(`An error has occurred during initialization: ${error}`);
        }
    }

    public async consume() {
        let message;
        
        try{
            this.channel.consume(this.queueName, (msg: any) => {
                if (msg) {
                    logger.info('Message received: ' + msg.content.toString());
                    this.channel.ack(msg);
                    message = msg.content.toString();
                    this.events.emit('message', message);
                }
            });
            logger.info('Consumer is now listening for messages');
        }
        catch (error) {
            logger.error(`An error has occurred while setting up message consumption: ${error}`);
        }
    }
}

const consumer = new MQConsumer();

export default consumer;