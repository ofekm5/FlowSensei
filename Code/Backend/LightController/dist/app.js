"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./logger"));
const Router_1 = __importDefault(require("./Router"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api', (0, Router_1.default)());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
    logger_1.default.error(`An error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
async function startServer() {
    try {
        logger_1.default.info('Starting demo Express server...');
        app.listen(PORT, () => {
            logger_1.default.info(`Demo server is running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
    }
}
startServer();
