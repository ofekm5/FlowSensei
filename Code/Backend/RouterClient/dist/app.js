"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const node_routeros_1 = require("node-routeros");
const app = (0, express_1.default)();
// RouterOS API configuration
const ros = new node_routeros_1.RouterOSAPI({
    host: '192.168.88.1',
    user: process.env.ROUTER_USER,
    password: process.env.ROUTER_PASSWORD
});
app.get('/routerboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ros.connect();
        const response = yield ros.write('/system/routerboard/print');
        ros.close();
        res.send(response);
        console.log("Successfully fetched data!");
    }
    catch (error) {
        console.error('API call failed:', error);
        // Type guard for standard Error objects
        if (error instanceof Error) {
            res.status(500).send(`Failed to fetch data from RouterOS: ${error.message}`);
        }
        else {
            // Handle cases where the error might not be an Error object
            res.status(500).send('Failed to fetch data from RouterOS due to an unknown error');
        }
    }
}));
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
