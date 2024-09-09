import dotenv from 'dotenv';
import express from 'express';
import MessageProcessor from './services/MQClient'; 

dotenv.config();

const app = express();
const exchange = process.env.EXCHANGE_NAME || 'elk_exchange';
const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const messageProcessor = new MessageProcessor();
  messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
  console.log(`Monitor service is running on port ${PORT}`);
});
