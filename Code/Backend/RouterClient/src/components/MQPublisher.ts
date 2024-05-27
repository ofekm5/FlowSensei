import amqp from 'amqplib';
import logger from '../logger'; 

class MQPublisher {
    private connection!: amqp.Connection;
    private channel!: amqp.Channel;
    private brokerURL:string; 
    private queueName:string;

    constructor(i_BrokerURL:string='amqp://localhost', i_QueueName:string='response_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
        this.initPublisher();
    }

    private async initPublisher() {
        try {
            this.connection = await amqp.connect(this.brokerURL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queueName , { durable: false });
        } 
        catch (error) {
            logger.error('An error has occurred during initialization: ' + error);
        }
    }

    public async publish(message: any) {
        try {
            if (!this.channel) {
                await this.initPublisher();
            }

            this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)));
        } 
        catch (error) {
            logger.error('An error has occurred: ' + error);
        }
    }
}

const publisher = new MQPublisher();

export default publisher;
