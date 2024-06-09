import logger from "./logger";
import publisher from "./components/MQPublisher";
import consumer from "./components/MQConsumer";
import express from 'express';
import dbClient from "./components/DBClient";

const app = express();
app.use(express.json()); 
// publisher.initPublisher();
// consumer.initConsumer();

app.get('/changePriorities', async (req, res) => {
    let mapOfPriorities;

    try {
        const msg = req.body;
        if(!msg || !msg.routerId || !msg.priorities){
            res.status(400).json({error: 'invalid request'});
            logger.info('Invalid request: ' + msg);
            return;
        }

        const routerId = msg.routerId;
        const prioritiesWanted = msg.priorities;
        logger.info(`routerId: ${routerId}, priorities: ${prioritiesWanted}`);
        const currentPriorities = await dbClient.selectPriorities(routerId);
        if(await checkPriorities(prioritiesWanted, currentPriorities)){
            res.status(200).json({response: 'priorities are already set to the desired values'});
            return;
        }

        mapOfPriorities = await calculateDeltaOfPriorities(prioritiesWanted, currentPriorities);
        await dbClient.updatePriorities(routerId, prioritiesWanted);

        let msgToPublish = {
            type: 'changePriority',
            priorities: mapOfPriorities
        };
        
       // await publisher.publish(msgToPublish);
       // const response = await consumer.consume();
        res.status(200).json({response: "done"});
    } 
    catch (error) {
        logger.error('An error has occurred: ' + error);
    }
});

async function checkPriorities(prioritiesWanted: any[], currentPriorities: any[]): Promise<boolean> {
    logger.info('Checking if priorities are equal');
    logger.info(`prioritiesWanted: ${prioritiesWanted}, currentPriorities: ${currentPriorities}`);
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

async function calculateDeltaOfPriorities(prioritiesWanted: any, currentPriorities: any){
    logger.info('entering calculateDeltaOfPriorities');
    let mapOfPriorities = new Map();

    for (const element of prioritiesWanted) {
            if(prioritiesWanted.indexOf(element) !== currentPriorities.indexOf(element)){
                mapOfPriorities.set(prioritiesWanted.indexOf(element) + 1, element); 
        }   
    }
    logger.info('mapOfPriorities: ' + mapOfPriorities);
    logger.info('exiting calculateDeltaOfPriorities');
    return mapOfPriorities;
}


app.listen(5000, () => {
    logger.info('Server is running on port 5000');
});



