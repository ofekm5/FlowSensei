import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './logger';
import apiClient from './components/APIClient';

dotenv.config();
const app = express();

async function test() {
    try {
        await apiClient.login('147.235.196.0', 'admin', '9DCMK8E5PU');
    } 
    catch (error) {
        console.error('Failed to establish SSH and API connection or login:', error);
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
//   }
  
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
  
const PORT = process.env.PORT || 5000;
  
app.listen(PORT, () => {
    test();
    //startConsumer();
    logger.info(`Server is running on port ${PORT}`);
});
