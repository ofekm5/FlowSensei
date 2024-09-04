"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const DBClient_1 = __importDefault(require("./components/DBClient"));
const logger_1 = __importDefault(require("./logger"));
const RabbitMQClient_1 = require("./components/RabbitMQClient");
const Router_1 = __importDefault(require("./Router"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const exchange = process.env.EXCHANGE_NAME || 'requests_exchange';
const rabbitURL = process.env.RABBIT_URL || 'amqp://myuser:mypass@localhost:5672';
const DATABASE_URL = process.env.DB_URL || 'mongodb://localhost:27017/mydb';
const secret = process.env.JWT_SECRET || 'fd5ac1609d0f2d6a5b7c91385c09669f36137c427abdc4613b51c714ee47e9b6f8c4fd1f65d7bb2a79a00af7274aee19874c77148397aaaac82473eaadc4fc14';
const app = (0, express_1.default)();
const rabbitMQClient = new RabbitMQClient_1.RabbitMQClient(rabbitURL, exchange);
app.use(express_1.default.json());
app.use('/api', (0, Router_1.default)(rabbitMQClient, secret));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
    logger_1.default.error(`An error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
async function startServer() {
    try {
        await (DBClient_1.default.connectToDB(DATABASE_URL).then(() => { DBClient_1.default.createTables(); }));
        logger_1.default.info('Connected to database and created tables');
        app.listen(PORT, () => {
            logger_1.default.info(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
    }
}
startServer();
