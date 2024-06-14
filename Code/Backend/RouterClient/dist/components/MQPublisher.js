"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = require("amqplib");
const logger_1 = __importDefault(require("../logger"));
//amqp://myuser:mypass@localhost:5672
//amqp://myuser:mypass@localhost:5673
class MQPublisher {
    constructor(i_BrokerURL = 'amqp://myuser:mypass@localhost:5672', i_QueueName = 'response_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
    }
    async initPublisher() {
        this.connection = await (0, amqplib_1.connect)(this.brokerURL);
        logger_1.default.info('Connected to RabbitMQ server: ' + this.brokerURL);
        this.channel = await this.connection.createChannel();
        logger_1.default.info('Channel created' + this.channel);
        await this.channel.assertQueue(this.queueName, { durable: false });
        logger_1.default.info('Queue created: ' + this.queueName);
    }
    async publish(message) {
        try {
            logger_1.default.info('Publishing message: ' + message);
            logger_1.default.info('Queue name: ' + this.queueName);
            this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)));
            logger_1.default.info('Message ' + message + ' published');
        }
        catch (error) {
            logger_1.default.error('An error has occurred: ' + error);
        }
    }
}
const publisher = new MQPublisher();
exports.default = publisher;
