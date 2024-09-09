import dotenv from 'dotenv';
import express from 'express';
import routerRoutes from './routes/routerRoutes'; 

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api', routerRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Monitor service is running on port ${PORT}`);
});
