"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const APIClient_1 = __importDefault(require("./APIClient"));
const Login_1 = __importDefault(require("./Login"));
const FirewallChecker_1 = __importDefault(require("./FirewallChecker"));
const PriorityModifier_1 = __importDefault(require("./PriorityModifier"));
const TransportMonitor_1 = __importDefault(require("./TransportMonitor"));
const logger_1 = __importDefault(require("../logger"));
let connectionReceiver;
let channelReceiver;
let connectionPublisher;
let channelPublisher;
const initReceiver = async () => {
    connectionReceiver = await amqplib_1.default.connect('amqp://localhost');
    channelReceiver = await connectionReceiver.createChannel();
    await channelReceiver.assertQueue('requests_queue', { durable: false });
};
const initPublisher = async () => {
    connectionPublisher = await amqplib_1.default.connect('amqp://localhost');
    channelPublisher = await connectionPublisher.createChannel();
    await channelPublisher.assertQueue('requests_queue', { durable: false });
};
const consumeAndSendMessages = async () => {
    try {
        let data;
        if (!channelReceiver) {
            await initReceiver();
        }
        logger_1.default.info('Waiting for messages in the requests_queue');
        channelReceiver.consume('requests_queue', async (message) => {
            await APIClient_1.default.connect();
            if (message !== null) {
                const command = JSON.parse(message.content.toString());
                const content = message.toString();
                logger_1.default.info(`Received message from message queue: ${content}`);
                //proccess the message according to the content
                switch (command.type) {
                    //login to the router
                    case 'login':
                        logger_1.default.info('Logging in');
                        data = (0, Login_1.default)(command);
                        break;
                    //change priority
                    case 'change_priority':
                        logger_1.default.info('Changing priority');
                        data = (0, PriorityModifier_1.default)(command);
                        break;
                    //fetch bandwidth data
                    case 'change_interval':
                        logger_1.default.info('changing interval');
                        data = TransportMonitor_1.default.changeInterval(command);
                        break;
                    //check firewwall
                    case 'check_firewall':
                        logger_1.default.info('checking firewall');
                        data = (0, FirewallChecker_1.default)(command);
                        break;
                }
                channelReceiver.ack(message);
                sendMessage(data);
            }
        });
    }
    catch (error) {
        logger_1.default.error('An error has occured ' + error);
    }
    finally {
        await APIClient_1.default.close();
    }
};
const sendMessage = async (message) => {
    try {
        if (!channelPublisher) {
            await initPublisher();
        }
        channelPublisher.sendToQueue('response_queue', Buffer.from(message));
    }
    catch (error) {
        logger_1.default.error('An error has occured ' + error);
    }
};
exports.default = { consumeAndSendMessages, sendMessage };
