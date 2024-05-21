import apiClient from "./APIClient";

interface ChangeIntervalMessage {
    type: "change_interval";
    interval: number;   
}

async function fetchRouterTransport() {    
    try{
        console.log("connecting to router")
        const client = await apiClient.connect();
        console.log("connected to router");

        let startTime = Date.now();
        let elapsedTime = 0;

        console.log("starting sniffer");
        await apiClient.write('/tool/sniffer/start');
        console.log("sniffer started");

        while(elapsedTime < interval * 10000){
            elapsedTime = Date.now() - startTime;
        }

        console.log("stopping sniffer");
        await apiClient.write('/tool/sniffer/stop');
        console.log("sniffer stopped");
        console.log("saving sniffer ");

        await apiClient.write('/tool/sniffer/save', '=file-name=packets');
        console.log("sniffer saved");
        console.log("fetching files");

        const files = await apiClient.write('/file/print');
        console.log(files);
    }
    catch(error){
        console.log("Failed to connect to the router")
        console.log(error);
        console.log((error as Error).message)
        throw new Error('Failed to fetch bandwidth');
    }
    finally{
        await apiClient.close();
    }    
}