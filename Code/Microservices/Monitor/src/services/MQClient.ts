import amqp, { Channel, Connection, Message } from 'amqplib/callback_api';
import logger from '../logger';
import { ElasticsearchService } from '../services/elasticsearchService';
import { KibanaService } from '../services/kibanaService';

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
            const { type } = parsedMessage;

            if (type == 'elkSetup') {
                responseMessage = await this.handleELKSetup(parsedMessage);
                responseMessage.Status = 'success';
            }
            else{
                logger.error('Invalid message type');
            } 
        } 
        catch (error) {
            responseMessage.Status = 'failed';
            responseMessage.Error = `Error processing message: ${error instanceof Error ? error.message : error}`;
            logger.error(`Error processing message: ${error}`);
        }

        return JSON.stringify(responseMessage);
    }

    private async handleELKSetup(parsedMessage: any): Promise<any> {
        const { routerIP } = parsedMessage;

        return await this.initializeELKForRouterIp(routerIP);
    }

    private async initializeELKForRouterIp(routerIp: string): Promise<any>{
        const elasticsearchServiceURL = `http://localhost:9200`;
        const kibanaServiceURL = `http://localhost:5601`;  

        try {
            const elasticsearchService = new ElasticsearchService(routerIp, elasticsearchServiceURL);
            await elasticsearchService.createIndexTemplate();  
            logger.info(`Index template created in Elasticsearch for router ${routerIp}`);

            const kibanaService = new KibanaService(routerIp, kibanaServiceURL);
            await kibanaService.createIndexPattern();  
            logger.info(`Index pattern created in Kibana for router ${routerIp}`);

            const filePath = './KibanaSetup.ndjson'; 
            const dashboardId = await kibanaService.importDashboard(filePath);  
            logger.info('Pre-created Kibana dashboard imported successfully.');
            logger.info(`reactjs link to paste in iframe: ${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`);
            const iframeUrl = `${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`;  

            return { message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`, iframeUrl: iframeUrl };
        } 
        catch (error: any) {
            logger.error(`Error initializing router ${routerIp}: ${error.message}`);
            return { error: `Failed to initialize router ${routerIp}` };
        }
    };
}

export default MessageProcessor;
