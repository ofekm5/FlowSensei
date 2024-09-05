"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routerController_1 = require("../controllers/routerController");
const router = (0, express_1.Router)();
// Add the initialize-router route
router.post('/initialize-router/:routerIp', routerController_1.initializeRouter);
exports.default = router;
