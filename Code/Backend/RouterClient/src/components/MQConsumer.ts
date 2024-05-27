import amqp from 'amqplib';
import logger from '../logger'; 

class MQConsumer {
    private connection!: amqp.Connection;
    private channel!: amqp.Channel;
    private brokerURL:string; 
    private queueName:string;

    constructor(i_BrokerURL:string='amqp://localhost', i_QueueName:string='requests_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
        this.initConsumer();
    }

    private async initConsumer() {
        try {
            this.connection = await amqp.connect(this.brokerURL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queueName, { durable: false });
            logger.info('Consumer initialized successfully');
        } 
        catch (error) {
            logger.error(`An error has occurred during initialization: ${error}`);
        }
    }

    public async consume(handle: (msg: amqp.ConsumeMessage | null) => void) {
        try {
            if (!this.channel) {
                await this.initConsumer();
            }
            this.channel.consume(this.queueName, (msg) => {
                try {
                    handle(msg);
                    if (msg) {
                        this.channel.ack(msg);
                    }
                } 
                catch (error) {
                    logger.error(`An error has occurred while handling a message: ${error}`);
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



        // await channel.assertQueue('requests_queue', { durable: false });
        // console.log('Waiting for messages in the requests_queue');
        // channel.consume('requests_queue', async (message)=>{
        //     await apiClient.connect();
        //     if(message !== null){
        //         const command = JSON.parse(message.content.toString());
        //         const content = message.toString();
        //         console.log(`Received message: ${content}`);

        //         //proccess the message according to the content
        //         switch(command.type){
        //             //login to the router
        //             case 'login':
        //                 console.log('Logging in');
        //                 handleLogin(command);
        //                 break;
        //             //change priority
        //             case 'change_priority':
        //                 console.log('Changing priority');
        //                 changePriority(command);
        //                 break;
        //             //fetch bandwidth data
        //             case 'change_interval':
        //                 console.log('changing interval');
        //                 transporter.changeInterval(command);
        //                 break;
        //             //check firewwall
        //             case 'check_firewall':
        //                 console.log('checking firewall');
        //                 checkFirewall(command);
        //                 break;
        //         }
        //         channel.ack(message);
        //     }
