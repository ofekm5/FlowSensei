"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
const APIClient_1 = __importDefault(require("./components/APIClient"));
dotenv_1.default.config();
const app = (0, express_1.default)();
async function test() {
    try {
        await APIClient_1.default.login('147.235.196.0', 'admin', '9DCMK8E5PU');
        console.log('Login successful');
    }
    catch (error) {
        console.error('Failed to establish SSH and API connection or login:', error);
        return;
    }
    try {
        await APIClient_1.default.markConnection({
            chain: 'forward',
            connectionMark: 'testConnection',
            ports: '80',
            protocol: 'tcp',
            addressList: 'testAddressList',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            inInterface: 'ether1',
            outInterface: 'ether2',
            connectionType: 'dscp',
            srcAddressList: 'srcTestList',
            inBridgePort: 'bridge1',
            outBridgePort: 'bridge2',
            time: '12:00-13:00',
            day: 'sunday',
            srcAddressType: 'unicast',
            dstAddressType: 'multicast',
        });
        console.log('markConnection successful');
    }
    catch (error) {
        console.error('Failed to mark connection:', error);
    }
    try {
        await APIClient_1.default.markPacket({
            chain: 'forward',
            connectionMark: 'testConnection',
            packetMark: 'testPacket',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            dstPort: '80',
            protocol: 'tcp',
            inInterface: 'ether1',
            outInterface: 'ether2',
            srcAddressList: 'srcTestList',
            dstAddressList: 'dstTestList',
            inBridgePort: 'bridge1',
            outBridgePort: 'bridge2',
            time: '12:00-13:00',
            day: 'sunday',
            srcAddressType: 'unicast',
            dstAddressType: 'multicast',
        });
        console.log('markPacket successful');
    }
    catch (error) {
        console.error('Failed to mark packet:', error);
    }
    try {
        await APIClient_1.default.dropPacket({
            chain: 'forward',
            srcAddress: '192.168.1.1',
            dstAddress: '192.168.1.2',
            srcPort: '1000',
            dstPort: '80',
            protocol: 'tcp',
            inInterface: 'ether1',
            outInterface: 'ether2',
            srcAddressList: 'srcTestList',
            dstAddressList: 'dstTestList',
            inBridgePort: 'bridge1',
            outBridgePort: 'bridge2',
            time: '12:00-13:00',
            day: 'sunday',
            srcAddressType: 'unicast',
            dstAddressType: 'multicast',
        });
        console.log('dropPacket successful');
    }
    catch (error) {
        console.error('Failed to drop packet:', error);
    }
    try {
        await APIClient_1.default.addNodeToQueueTree({
            name: 'testQueue',
            parent: 'global',
            packetMark: 'testPacket',
            priority: '1',
            maxLimit: '10M',
            limitAt: '5M',
            burstLimit: '12M',
            burstThreshold: '8M',
            burstTime: '10s',
            queueType: 'default',
        });
        console.log('addNodeToQueueTree successful');
    }
    catch (error) {
        console.error('Failed to add node to queue tree:', error);
    }
}
// async function startConsumer(queueName) {
//     try {
//       const connection = await amqp.connect(RABBITMQ_URL);
//       const channel = await connection.createChannel();
//       await channel.assertQueue(queueName, { durable: true });
//       console.log(`Waiting for messages in ${queueName}. To exit press CTRL+C`);
//       channel.consume(queueName, (msg) => {
//         if (msg !== null) {
//           console.log(`Received message from ${queueName}: ${msg.content.toString()}`);
//           // Process the message here
//           channel.ack(msg);
//         }
//       }, { noAck: false });
//     } catch (error) {
//       console.error('Error in consumer:', error);
//     }
// }
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    test();
    //startConsumer();
    logger_1.default.info(`Server is running on port ${PORT}`);
});
