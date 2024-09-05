import { Router } from 'express';
import { initializeRouter } from '../controllers/routerController';

const router = Router();

// Add the initialize-router route
router.post('/initialize-router/:routerIp', initializeRouter);

export default router;
