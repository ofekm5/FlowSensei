"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = require("amqplib");
const logger_1 = __importDefault(require("../logger"));
const events_1 = require("events");
class MQConsumer {
    constructor(i_BrokerURL = 'amqp://myuser:mypass@localhost:5672', i_QueueName = 'response_queue') {
        this.brokerURL = i_BrokerURL;
        this.queueName = i_QueueName;
        this.events = new events_1.EventEmitter();
    }
    async initConsumer() {
        try {
            this.connection = await (0, amqplib_1.connect)(this.brokerURL);
            logger_1.default.info('Connected to RabbitMQ server: ' + this.brokerURL);
            this.channel = await this.connection.createChannel();
            logger_1.default.info('Channel created' + this.channel);
            await this.channel.assertQueue(this.queueName, { durable: false });
            logger_1.default.info('Queue created: ' + this.queueName);
        }
        catch (error) {
            logger_1.default.error(`An error has occurred during initialization: ${error}`);
        }
    }
    async consume() {
        let message;
        try {
            this.channel.consume(this.queueName, (msg) => {
                if (msg) {
                    logger_1.default.info('Message received: ' + msg.content.toString());
                    this.channel.ack(msg);
                    message = msg.content.toString();
                    this.events.emit('message', message);
                }
            });
            logger_1.default.info('Consumer is now listening for messages');
        }
        catch (error) {
            logger_1.default.error(`An error has occurred while setting up message consumption: ${error}`);
        }
    }
}
const consumer = new MQConsumer();
exports.default = consumer;
