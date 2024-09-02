// src/routes/routerRoutes.ts

import { Router } from 'express';
import { RouterController } from '../controllers/routerController';

const router = Router();

router.post('/routers', RouterController.addRouter);

export default router;
