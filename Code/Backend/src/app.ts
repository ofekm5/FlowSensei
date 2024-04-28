require('dotenv').config();

import express, { Request, Response } from 'express';
import { RouterOSAPI } from 'node-routeros';

const app = express();

const ros = new RouterOSAPI({
    host: '192.168.88.1',
    user: process.env.ROUTER_USER,
    password: process.env.ROUTER_PASSWORD
});

app.get('/routerboard', async (req: Request, res: Response) => {
    try {
        await ros.connect();
        const response = await ros.write('/system/routerboard/print');
        ros.close();
        res.send(response);
        console.log("Successfully fetched data!");
    } catch (error: unknown) {
        console.error('API call failed:', error);
        // Type guard for standard Error objects
        if (error instanceof Error) {
            res.status(500).send(`Failed to fetch data from RouterOS: ${error.message}`);
        } else {
            // Handle cases where the error might not be an Error object
            res.status(500).send('Failed to fetch data from RouterOS due to an unknown error');
        }
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
