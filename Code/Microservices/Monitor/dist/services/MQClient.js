"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const logger_1 = __importDefault(require("../logger"));
const elasticsearchService_1 = require("../services/elasticsearchService");
const kibanaService_1 = require("../services/kibanaService");
class MessageProcessor {
    ConnectToRabbit(rabbitMqUrl, exchange) {
        callback_api_1.default.connect(rabbitMqUrl, (error0, connection) => {
            if (error0) {
                logger_1.default.error(`Connection error: ${error0}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                return;
            }
            connection.createChannel((error1, channel) => {
                if (error1) {
                    logger_1.default.error(`Channel error: ${error1}`);
                    connection.close();
                    setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                    return;
                }
                channel.assertExchange(exchange, 'direct', { durable: false });
                channel.assertQueue('queue', { durable: false }, (error2, q) => {
                    if (error2) {
                        logger_1.default.error(`Queue assertion error: ${error2}`);
                        channel.close(() => { });
                        connection.close(() => { });
                        setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
                        return;
                    }
                    channel.bindQueue(q.queue, exchange, 'request_key');
                    channel.prefetch(1);
                    logger_1.default.info(' [x] Awaiting RPC requests');
                    channel.consume(q.queue, async (msg) => {
                        if (msg) {
                            const messageContent = msg.content.toString();
                            logger_1.default.info(` [.] Received ${messageContent}`);
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
                logger_1.default.error(`Connection error: ${err}`);
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
            });
            connection.on('close', () => {
                logger_1.default.info('Connection closed, retrying...');
                setTimeout(() => this.ConnectToRabbit(rabbitMqUrl, exchange), 5000);
            });
        });
    }
    async processMessage(message) {
        let responseMessage = { Status: 'failed' };
        try {
            const parsedMessage = JSON.parse(message);
            const { type } = parsedMessage;
            if (type == 'elkSetup') {
                responseMessage = await this.handleELKSetup(parsedMessage);
                responseMessage.Status = 'success';
            }
            else {
                logger_1.default.error('Invalid message type');
            }
        }
        catch (error) {
            responseMessage.Status = 'failed';
            responseMessage.Error = `Error processing message: ${error instanceof Error ? error.message : error}`;
            logger_1.default.error(`Error processing message: ${error}`);
        }
        return JSON.stringify(responseMessage);
    }
    async handleELKSetup(parsedMessage) {
        const { routerIP } = parsedMessage;
        return await this.initializeELKForRouterIp(routerIP);
    }
    async initializeELKForRouterIp(routerIp) {
        const elasticsearchServiceURL = `http://localhost:9200`;
        const kibanaServiceURL = `http://localhost:5601`;
        try {
            const elasticsearchService = new elasticsearchService_1.ElasticsearchService(routerIp, elasticsearchServiceURL);
            await elasticsearchService.createIndexTemplate();
            logger_1.default.info(`Index template created in Elasticsearch for router ${routerIp}`);
            const kibanaService = new kibanaService_1.KibanaService(routerIp, kibanaServiceURL);
            await kibanaService.createIndexPattern();
            logger_1.default.info(`Index pattern created in Kibana for router ${routerIp}`);
            const filePath = './KibanaSetup.ndjson';
            const dashboardId = await kibanaService.importDashboard(filePath);
            logger_1.default.info('Pre-created Kibana dashboard imported successfully.');
            logger_1.default.info(`reactjs link to paste in iframe: ${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`);
            const iframeUrl = `${kibanaServiceURL}/app/kibana#/dashboard/${dashboardId}?embed=true&_g=()`;
            return { message: `Router ${routerIp} initialized with Elasticsearch and Kibana, and panel imported.`, iframeUrl: iframeUrl };
        }
        catch (error) {
            logger_1.default.error(`Error initializing router ${routerIp}: ${error.message}`);
            return { error: `Failed to initialize router ${routerIp}` };
        }
    }
    ;
}
exports.default = MessageProcessor;
