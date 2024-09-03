import dotenv from 'dotenv';
import express from 'express';
import logger from "./logger";
import createRouter from './Router';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use('/api', createRouter());  

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`An error occurred: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
    try {
        logger.info('Starting demo Express server...');
        app.listen(PORT, () => {
            logger.info(`Demo server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('An error has occurred: ' + error);
    }
}

startServer();
