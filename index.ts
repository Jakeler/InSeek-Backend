import * as mongo from './mongo';
import * as mqtt from "./mqtt";
import * as downloader from './download';

async function start() { // Top level await
    await mqtt.init();
    await mongo.connect();
    // await mongo.setupDB();
    
    let cupIpList = await mongo.getCupIpList();
    console.log(cupIpList)
    
    
    const intervalId = setInterval(async () => {
        await downloader.syncAll(cupIpList);
    }, 5000);

}

start();
