import amqp from 'amqplib';
import apiClient from './APIClient';
import handleLogin from './Login';
import checkFirewall from './FirewallChecker';
import changePriority from './PriorityModifier';
import transporter from './TransportMonitor';
import logger from '../logger';

let connectionReceiver: amqp.Connection;
let channelReceiver: amqp.Channel;
let connectionPublisher: amqp.Connection;
let channelPublisher: amqp.Channel;

const initReceiver = async () => {
    connectionReceiver = await amqp.connect('amqp://localhost');
    channelReceiver = await connectionReceiver.createChannel();
    await channelReceiver.assertQueue('requests_queue', { durable: false });
}

const initPublisher = async () => {
    connectionPublisher = await amqp.connect('amqp://localhost');
    channelPublisher = await connectionPublisher.createChannel();
    await channelPublisher.assertQueue('requests_queue', { durable: false });
}

const consumeAndSendMessages = async () => {
    try{
        let data: Promise<void>; 

        if(!channelReceiver){
            await initReceiver();
        }

        logger.info('Waiting for messages in the requests_queue');
        channelReceiver.consume('requests_queue', async (message)=>{
            await apiClient.connect();
            if(message !== null){
                const command = JSON.parse(message.content.toString());
                const content = message.toString();
                logger.info(`Received message from message queue: ${content}`);

                //proccess the message according to the content
                switch(command.type){
                    //login to the router
                    case 'login':
                        logger.info('Logging in');
                        data = handleLogin(command);
                        break;
                    //change priority
                    case 'change_priority':
                        logger.info('Changing priority');
                        data = changePriority(command);
                        break;
                    //fetch bandwidth data
                    case 'change_interval':
                        logger.info('changing interval');
                        data = transporter.changeInterval(command);
                        break;
                    //check firewwall
                    case 'check_firewall':
                        logger.info('checking firewall');
                        data = checkFirewall(command);
                        break;
                }
                channelReceiver.ack(message);
                sendMessage(data);
            }
            
        })
    }
    catch(error){
        logger.error('An error has occured ' + error);
    }
    finally{
        await apiClient.close();
    }
}

const sendMessage = async (message: any) => {
    try{
        if(!channelPublisher){
            await initPublisher();
        }

        channelPublisher.sendToQueue('response_queue', Buffer.from(message));
    }
    catch(error){
        logger.error('An error has occured ' + error)
    }
}

export default {consumeAndSendMessages, sendMessage};
