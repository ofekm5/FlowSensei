
require('dotenv').config();

import express, { Request, Response } from 'express';
import { RouterOSAPI } from 'node-routeros';

const app = express();
import amqp from 'amqplib';
const fs = require('fs');
const https = require('https');
import knownGamingPorts from './gamingPorts';
import { setInterval } from 'timers';
import { PassThrough } from 'stream';
import { connect } from 'http2';

interface LoginMessage {
    type: "login";
    userName: string;
    password: string;
}

interface ChangePriorityMessage {
    type: "change_priority";
    priorities: string[];
}

interface ChangeIntervalMessage {
    type: "change_interval";
    interval: number;   
}

interface CheckFirewallMessage {
    type: "check_firewall";
}

const RosApi = require('node-routeros').RouterOSAPI; 
let interval = 1
console.log("reading certificates");
const cert = fs.readFileSync('./RouterClient/SSL/FlowSensei.crt');
        const key = fs.readFileSync('./RouterClient/SSL/FlowSensei.key');
        const passphrase = 'my-secure-passphrase';
        const agent = new https.Agent({
            cert: cert,
            key: key,
            passphrase: passphrase, // Add this line if your key is passphrase-protected
            rejectUnauthorized: false // Set this to true if you trust the RouterOS certificate
          });

const conn = new RosApi({
    host: '192.168.88.1',
    user: process.env.ROUTER_USER,
    password: process.env.ROUTER_PASSWORD,
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

// consumeMessages();
// setInterval(async ()=>{
//     const fileName = fetchBandwidth();

// }, interval * 1000);
// //start the server
// app.listen(process.env.PORT, () => {
//     console.log(`Server running on http://localhost:${process.env.PORT}`);
// });

//fetchBandwidth();
//console.log(knownGamingPorts);
//mangleGaming();

//in this function we consume the messages from the queue
async function consumeMessages(){
    try{
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue('requests_queue', { durable: false });
        console.log('Waiting for messages in the requests_queue');
        channel.consume('requests_queue', async (message)=>{
            await conn.connect();
            if(message !== null){
                const command = JSON.parse(message.content.toString());
                const content = message.toString();
                console.log(`Received message: ${content}`);

                //proccess the message according to the content
                switch(command.type){
                    //login to the router
                    case 'login':
                        console.log('Logging in');
                        handleLogin(command);
                        break;
                    //change priority
                    case 'change_priority':
                        console.log('Changing priority');
                        handleChangePriority(command);
                        break;
                    //fetch bandwidth data
                    case 'change_interval':
                        console.log('changing interval');
                        handleChangeInterval(command);
                        break;
                    //check firewwall
                    case 'check_firewall':
                        console.log('checking firewall');
                        handleCheckFirewall(command);
                        break;
                }

                //acknowledge the message
                channel.ack(message);
            }
            
        })
    }
    catch(error){
        console.log(error)
        console.error('An error has occured', error);
    }
    finally{
        await conn.close();
    }
}



//handling changing the priority
async function handleChangePriority(command: ChangePriorityMessage){
    //delete previous queue

    const priorities = command.priorities;
    for(let i = 0; i < priorities.length; i++){
        const priority = priorities[i];
        addMangle(priority);    
    }

    createQueueTree(priorities);

}

async function handleCheckFirewall(command: CheckFirewallMessage){
    await conn.connect();
    const allFirewallRules = await conn.write('/ip/firewall/filter/print');
    console.log(allFirewallRules);
    await conn.close();
    // const allFirewallRules = await ros.menu('ip/firewall/filter').get();
    // console.log(allFirewallRules);
}

async function handleChangeInterval(command: ChangeIntervalMessage){
    interval = command.interval;
}

async function handleLogin(command: LoginMessage){
    const userName = command.userName;
    const password = command.password;
    try{
        const data = await conn.write(`/user/print?where=name=${userName}`);
        if(data.length > 0 && data[0].password === password){
            return 'user logged in';
        }
        else{
            return 'user not found'
        } 
    }
    catch(error){
        throw new Error('Failed to login');
    }
    
    
}

async function addMangle(priority: string) {
    try {
        switch(priority){
            case 'web-surfing':
                mangleWebSurfing();
                break;
            case 'gaming':
                mangleGaming();
                break;
            case 'video-calls':
                mangleAllVideoCalls();
                break;
            case 'email':
                mangleEmails();
                break;
        }
    } 
    catch (error) {
        throw new Error((error as Error).message)
    }
}

async function mangleWebSurfing() {
    try {
           await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=80,443',
            '=new-connection-mark=web-surfing',
            '=passthrough=yes',
            '=protocol=tcp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=53',
            '=new-connection-mark=web-surfing',
            '=passthrough=yes',
            '=protocol=udp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=web-surfing',
            '=new-packet-mark=web-surfing-packet',
            '=passthrough=no',
        ]);
    } 
    catch (error) {
       throw new Error('Failed to mangle web surfing'); 
    }
}

async function mangleEmails() {
    try {
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=25,587,465,110,995,143,993',
            '=new-connection-mark=email',
            '=passthrough=yes',
            '=protocol=tcp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=dst-port=53',
            '=new-connection-mark=email',
            '=passthrough=no',
            '=protocol=udp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=email',
            '=new-packet-mark=email-packet',
            '=passthrough=no',
        ]);
    } 
    catch (error) {
        throw new Error('Failed to mangle emails');
    }
}


async function mangleAllVideoCalls() {
    try {
        console.log("connecting to router")
        const client = await conn.connect();
        console.log("connected to router");
        console.log("mangling video calls");
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=80,443,8801,8802,50000-50059',
            '=new-connection-mark=video-calls',
            '=passthrough=yes',
            '=protocol=tcp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-connection',
            '=chain=prerouting',
            '=dst-port=19302-19309,3478-3481,8801-8810,50000-50059',
            '=new-connection-mark=video-calls',
            '=passthrough=yes',
            '=protocol=udp',
        ]);
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=video-calls',
            '=new-packet-mark=video-calls-packet',
            '=passthrough=no',
        ]);
    }
    catch (error) {
        throw new Error('Failed to mangle video calls');
    }
    finally{
        await conn.close();
    }
}

async function mangleGaming() {
    try {
        console.log("connecting to router")
        const client = await conn.connect();
        console.log("connected to router");
        console.log("mangling gaming ports");
        for(let i = 0; i < knownGamingPorts.length; i++){
            const gamingPort = knownGamingPorts[i];
            console.log(gamingPort);
            await conn.write('/ip/firewall/mangle/add', [
                '=action=mark-connection',
                '=chain=prerouting',
                `=dst-port=${gamingPort.ports}`,
                '=new-connection-mark=gaming',
                '=passthrough=yes',
                `=protocol=${gamingPort.protocol}`,
            ]);
        }
        await conn.write('/ip/firewall/mangle/add', [
            '=action=mark-packet',
            '=chain=prerouting',
            '=connection-mark=gaming',
            '=new-packet-mark=gaming-packet',
            '=passthrough=no',
        ]);
    } 
    catch (error) {
      throw new Error('Failed to mangle gaming');  
    }
    finally{
        await conn.close();
    }
}

async function createQueueTree(priorities: string[]) {
   try {
        await conn.write('/queue/tree/add', [
            '=name=root',
            '=parent=global',
        ]
        );

        for(let i = 0; i < priorities.length; i++){
            let priority = priorities[i];
            priority += '-packet';
            await conn.write('/queue/tree/add',
            [
                '=name=root',
                '=packet-marks=' + priority,
                '=priority=' + (i + 1),
            ]);
        }
   } 
   catch (error) {
    throw new Error('Failed to create queue tree');
   }
}

async function fetchBandwidth() {
    
    try{
        //console.log(ros);
        console.log("connecting to router")
        const client = await conn.connect();
        console.log("connected to router");

        let startTime = Date.now();
        let elapsedTime = 0;

        console.log("starting sniffer");
        await conn.write('/tool/sniffer/start');
        console.log("sniffer started");

        while(elapsedTime < interval * 10000){
            elapsedTime = Date.now() - startTime;
        }

        console.log("stopping sniffer");
        await conn.write('/tool/sniffer/stop');
        console.log("sniffer stopped");
        console.log("saving sniffer ");

        await conn.write('/tool/sniffer/save', '=file-name=packets');
        console.log("sniffer saved");
        console.log("fetching files");

        const files = await conn.write('/file/print');
        console.log(files);
    }
    catch(error){
        console.log("Failed to connect to the router")
        console.log(error);
        console.log((error as Error).message)
        throw new Error('Failed to fetch bandwidth');
    }
    finally{
        await conn.close();
    }    
}