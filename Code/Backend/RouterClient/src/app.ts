
require('dotenv').config();

import express, { Request, Response } from 'express';
import { RouterOSAPI } from 'node-routeros';

const app = express();
import amqp from 'amqplib';
const knownGamingPorts = require('./gamingPorts').gamingPorts;
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

const RouterOsClient = require('routeros-client').RouterOSClient;
let interval = 1
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

consumeMessages();
setInterval(async ()=>{
    const fileName = fetchBandwidth();

}, interval * 1000);
//start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});

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
        await ros.close();
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
    const allFirewallRules = await ros.menu('ip/firewall/filter').get();
    console.log(allFirewallRules);
}

async function handleChangeInterval(command: ChangeIntervalMessage){
    interval = command.interval;
}

async function handleLogin(command: LoginMessage){
    const userName = command.userName;
    const password = command.password;
    try{
        const data = await ros.write(`/user/print?where=name=${userName}`);
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
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-connection',
            chain: 'prerouting',
            dstPort: '80,443',
            newConnectionMark: 'web-surfing',
            passthrough: 'yes',
            protocol: 'tcp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-conection',
            chain: 'prerouting',
            dstPort: '53',
            newConnectionMark: 'web-surfing',
            PassThrough: 'yes',
            protocol: 'udp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-packet',
            chain: 'prerouting',
            connectionMark: 'web-surfing',
            newPacketMark: 'web-surfing-packet',
            passthrough: 'no',
        });
    } 
    catch (error) {
       throw new Error('Failed to mangle web surfing'); 
    }
}

async function mangleEmails() {
    try {
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-connection',
            chain: 'prerouting',
            dstPort: '25,587,465,110,995,143,993',
            newConnectionMark: 'email',
            passthrough: 'yes',
            protocol: 'tcp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-packet',
            chain: 'prerouting',
            dstPort: '53',
            newConnectionMark: 'email',
            passthrough: 'no',
            protocol: 'udp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-packet',
            chain: 'prerouting',
            connectionMark: 'email',
            newPacketMark: 'email-packet',
            passthrough: 'no',
        });
    } 
    catch (error) {
        throw new Error('Failed to mangle emails');
    }
}

async function fetchBandwidth() {
    try{
        const packets = [];
        let startTime = Date.now();
        let elapsedTime = 0;
        await ros.menu('/tool sniffer').call('set', { 'file-name': 'packets' });
        await ros.menu('/tool sniffer').call('start');

        while(elapsedTime < interval){
            elapsedTime = Date.now() - startTime;
        }

        await ros.menu('/tool sniffer').call('stop');
        const files = await ros.menu('/file').print();
        const fileName = files[files.length - 1].name;
        return fileName;
    }
    catch(error){
        throw new Error('Failed to fetch bandwidth');
    }
    
}

async function mangleAllVideoCalls() {
    try {
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-connection',
            chain: 'prerouting',
            dstPort: '80,443,8801,8802,50000-50059',
            newConnectionMark: 'video-calls',
            passthrough: 'yes',
            protocol: 'tcp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-connection',
            chain: 'prerouting',
            dstPort: '19302-19309,3478-3481,8801-8810,50000-50059',
            newConnectionMark: 'video-calls',
            passthrough: 'yes',
            protocol: 'udp',
        });
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-packet',
            chain: 'prerouting',
            connectionMark: 'video-calls',
            newPacketMark: 'video-calls-packet',
            passthrough: 'no',
        });
    }
    catch (error) {
        throw new Error('Failed to mangle video calls');
    }
}

async function mangleGaming() {
    try {
        for(let i = 0; i < knownGamingPorts.length; i++){
            const gamingPort = knownGamingPorts[i];
            await ros.menu('/ip firewall mangle').add({
                action: 'mark-connection',
                chain: 'prerouting',
                dstPort: gamingPort.ports,
                newConnectionMark: 'gaming',
                passthrough: 'yes',
                protocol: gamingPort.protocol,
            });
        }
        await ros.menu('/ip firewall mangle').add({
            action: 'mark-packet',
            chain: 'prerouting',
            connectionMark: 'gaming',
            newPacketMark: 'gaming-packet',
            passthrough: 'no',
        });
    } 
    catch (error) {
      throw new Error('Failed to mangle gaming');  
    }
}

async function createQueueTree(priorities: string[]) {
   try {
        await ros.menu('/queue tree').add({
            name: 'root',
            parent: 'global',
        });
    
        for(let i = 0; i < priorities.length; i++){
            let priority = priorities[i];
            priority += '-packet';
            await ros.menu('/queue tree').add({
                name: priority,
                parent: 'root',
                packetMarks: priority,
                priority: i + 1,
            });
        }
   } 
   catch (error) {
    throw new Error('Failed to create queue tree');
   }
}