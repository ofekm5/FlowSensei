"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
const MQClient_1 = __importDefault(require("./components/MQClient"));
const APIClient_1 = __importDefault(require("./components/APIClient"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitMqUrl = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
const hourLimitInterval = process.env.HOUR_LIMIT_INTERVAL || 2;
const app = (0, express_1.default)();
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    const messageProcessor = new MQClient_1.default();
    messageProcessor.ConnectToRabbit(rabbitMqUrl, exchange);
    logger_1.default.info(`Server is running on port ${PORT}`);
    node_cron_1.default.schedule(`0 */${hourLimitInterval} * * *`, async () => {
        try {
            await APIClient_1.default.adjustLimit();
            logger_1.default.info('Successfully ran adjustLimit cron job');
        }
        catch (error) {
            logger_1.default.error(`Failed to run adjustLimit cron job: ${error.message}`);
        }
    });
});
exports.default = app;
