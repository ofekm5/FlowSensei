"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const express_1 = __importDefault(require("express"));
const DBClient_1 = __importDefault(require("./components/DBClient"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// publisher.initPublisher();
// consumer.initConsumer();
app.get('/changePriorities', async (req, res) => {
    let mapOfPriorities;
    try {
        const msg = req.body;
        if (!msg || !msg.routerId || !msg.priorities) {
            res.status(400).json({ error: 'invalid request' });
            logger_1.default.info('Invalid request: ' + msg);
            return;
        }
        const routerId = msg.routerId;
        const prioritiesWanted = msg.priorities;
        logger_1.default.info(`routerId: ${routerId}, priorities: ${prioritiesWanted}`);
        const currentPriorities = await DBClient_1.default.selectPriorities(routerId);
        if (await checkPriorities(prioritiesWanted, currentPriorities)) {
            res.status(200).json({ response: 'priorities are already set to the desired values' });
            return;
        }
        mapOfPriorities = await calculateDeltaOfPriorities(prioritiesWanted, currentPriorities);
        await DBClient_1.default.updatePriorities(routerId, prioritiesWanted);
        let msgToPublish = {
            type: 'changePriority',
            priorities: mapOfPriorities
        };
        // await publisher.publish(msgToPublish);
        // const response = await consumer.consume();
        res.status(200).json({ response: "done" });
    }
    catch (error) {
        logger_1.default.error('An error has occurred: ' + error);
    }
});
async function checkPriorities(prioritiesWanted, currentPriorities) {
    logger_1.default.info('Checking if priorities are equal');
    logger_1.default.info(`prioritiesWanted: ${prioritiesWanted}, currentPriorities: ${currentPriorities}`);
    let isPrioritiesEqual = true;
    if (prioritiesWanted.length === currentPriorities.length) {
        for (const element of prioritiesWanted) {
            if (element !== currentPriorities[prioritiesWanted.indexOf(element)]) {
                isPrioritiesEqual = false;
            }
        }
        if (isPrioritiesEqual) {
            return true;
        }
    }
    return false;
}
async function calculateDeltaOfPriorities(prioritiesWanted, currentPriorities) {
    logger_1.default.info('entering calculateDeltaOfPriorities');
    let mapOfPriorities = new Map();
    for (const element of prioritiesWanted) {
        if (prioritiesWanted.indexOf(element) !== currentPriorities.indexOf(element)) {
            mapOfPriorities.set(prioritiesWanted.indexOf(element) + 1, element);
        }
    }
    logger_1.default.info('mapOfPriorities: ' + mapOfPriorities);
    logger_1.default.info('exiting calculateDeltaOfPriorities');
    return mapOfPriorities;
}
app.listen(5000, () => {
    logger_1.default.info('Server is running on port 5000');
});
