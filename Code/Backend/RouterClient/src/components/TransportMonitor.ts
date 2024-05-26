import logger from "../logger";
import apiClient from "./APIClient";
let interval = 1;

interface ChangeIntervalMessage {
    type: "change_interval";
    interval: number;   
}

async function changeInterval(command: ChangeIntervalMessage){
    interval = command.interval;
}

async function fetchRouterTransport() { 
    apiClient.write('/tool/sniffer/start').then(()=>{
        logger.info("Sniffer started");
        let elapsedTime = 0;
        let startTime = Date.now();
        while(elapsedTime < interval * 1000){
            elapsedTime = Date.now() - startTime;
        }
    }
)
.catch((error)=>{
    logger.error("Failed to fetch router transport");
    throw new Error('Failed to fetch router transport');
})
.then(()=>{
   logger.info("Stopping sniffer");
   apiClient.write('/tool/sniffer/stop')
   .then(()=>{
        logger.info("Sniffer stopped");
    })
    .then(()=>{
        logger.info("Saving sniffer");
        apiClient.write('/tool/sniffer/save', '=file-name=packets')
        .then(()=>{
            logger.info("Sniffer saved");
        })
        .then(()=>{
            logger.info("Fetching files");
            apiClient.write('/file/print')
            .then((files)=>{
                console.log(files);
                const fileName = files[files.length - 1];
                return fileName;
            })
        })
})})
.catch((error)=>{
    logger.error("Failed to fetch router transport "  +error);
    throw new Error('Failed to fetch router transport');
});
}

export default {fetchRouterTransport, changeInterval, interval};