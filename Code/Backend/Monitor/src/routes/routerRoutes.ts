import { Router } from 'express';
import { initializeELKForRouter } from '../controllers/routerController';

const router = Router();

router.post('/initialize-router/:routerIp', initializeELKForRouter);

export default router;
