interface LoginMessage {
    type: "login";
    userName: string;
    password: string;
}

interface ChangePriorityMessage {
    type: "change_priority";
    priotities: string[];
}

interface FetchBandwidthMessage {
    type: "fetch_bandwidth";
}

interface CheckFirewallMessage {
    type: "check_firewall";
}

require('dotenv').config();

import express, { Request, Response } from 'express';
import { RouterOSAPI } from 'node-routeros';

const app = express();
import amqp = require('amqplib');

const RouterOsClient = require('routeros-client').RouterOSClient;

const ros = new RouterOsClient({
    host: '192.168.88.1',
    user: process.env.ROUTER_USER,
    password: process.env.ROUTER_PASSWORD
});

//in this endpoint the user tries to login to the router
// app.get('/login', async (req: Request, res: Response) => {
//     try {
//         await ros.connect();
//         const response = await ros.write('/system/routerboard/print');
//         ros.close();
//         res.send(response);
//         console.log("Successfully fetched data!");
//     } catch (error: unknown) {
//         console.error('API call failed:', error);
//         // Type guard for standard Error objects
//         if (error instanceof Error) {
//             res.status(500).send(`Failed to fetch data from RouterOS: ${error.message}`);
//         } else {
//             // Handle cases where the error might not be an Error object
//             res.status(500).send('Failed to fetch data from RouterOS due to an unknown error');
//         }
//     }
// });

//in this function we consume the messages from the queue
async function consumeMessages(){
    try{
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue('requests_queue', { durable: false });
        console.log('Waiting for messages in the requests_queue');
        channel.consume('requests_queue', async (message)=>{
            await ros.connect();
            if(message !== null){
                const command = JSON.parse(message.content.toString());
                const content = message.toString();
                console.log(`Received message: ${content}`);

                //proccess the message according to the content
                switch(command.type){
                    //login to the router
                    case 'login':
                        console.log('Logging in');
                        await handleLogin(command);
                    //change priority
                    case 'change_priority':
                        console.log('Changing priority');
                        await handleChangePriority(command);
                        break;
                    //fetch bandwidth data
                    case 'fetch_bandwidth':
                        console.log('fetching bandwidth data');
                        await handleFetchBandwidth(command);
                        break;
                    //check firewwall
                    case 'check_firewall':
                        console.log('checking firewall');
                        await handleCheckFirewall(command);
                        break;
                }

                //acknowledge the message
                channel.ack(message);
            }
            
        })
    }
    catch(error){
        console.error('Failed to consume messages:', error);
    }
    finally{
        await ros.close();
    }
}

consumeMessages();
//start the server
// app.listen(process.env.PORT, () => {
//     console.log(`Server running on http://localhost:${process.env.PORT}`);
// });

//handling changing the priority
async function handleChangePriority(command: ChangePriorityMessage){

}

async function handleCheckFirewall(command: CheckFirewallMessage){
    const allFirewallRules = await ros.menu('ip/firewall/filter').get();
    console.log(allFirewallRules);
}

async function handleFetchBandwidth(command: FetchBandwidthMessage){

}

async function handleLogin(command: LoginMessage){
    const userName = command.userName;
    const password = command.password;

    const data = await ros.write(`/user/print?where=name=${userName}`);
    if(data.length > 0 && data[0].password === password){
        console.log('User logged in');
    }
    else{
        console.log('User does not exist or password is incorrect');
    } 
}

