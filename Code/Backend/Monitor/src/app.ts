// src/app.ts

import express from 'express';
import routerRoutes from './routes/routerRoutes';

const app = express();

app.use(express.json());

app.use('/api', routerRoutes);

export default app;
