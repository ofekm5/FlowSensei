import {connect} from 'amqplib';
import logger from '../logger'; 
//amqp://myuser:mypass@localhost:5672

class MQPublisher {
    private connection!: any;
    private channel!: any;
    private brokerURL:string; 
    private queueName:string;

    constructor(i_BrokerURL:string='amqp://myuser:mypass@localhost:5672', i_QueueName:string='response_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
        
    }

    public async initPublisher() {
        this.connection = await connect(this.brokerURL);
        logger.info('Connected to RabbitMQ server: ' + this.brokerURL);
        this.channel = await this.connection.createChannel();
        logger.info('Channel created' + this.channel);
        await this.channel.assertQueue(this.queueName, {durable: false});
        logger.info('Queue created: ' + this.queueName);
    }

    public async publish(message: any) {
        
        try {
            logger.info('Publishing message: ' + message);
            logger.info('Queue name: ' + this.queueName);
            this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)));
            logger.info('Message ' + message + ' published');
        } 
        catch (error) {
            logger.error('An error has occurred: ' + error);
        }
    }
}

const publisher = new MQPublisher();

export default publisher;


