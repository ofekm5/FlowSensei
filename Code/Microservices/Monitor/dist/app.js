"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const MQClient_1 = __importDefault(require("./services/MQClient"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const exchange = process.env.EXCHANGE_NAME || 'elk_exchange';
const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    const messageProcessor = new MQClient_1.default();
    messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
    console.log(`Monitor service is running on port ${PORT}`);
});
