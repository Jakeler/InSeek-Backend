import * as mongo from './mongo';
import * as mqtt from "./mqtt";
import * as downloader from './download';

async function start() { // Top level await
    await mqtt.init();
    await mongo.connect();

    // await mongo.setupDB(); //run this only once
    
    let cupIpList = await mongo.getCupIpList();
    console.log(cupIpList)
    
    
    const intervalId = setInterval(async () => {  // Block if previous run not done or something?
        const cupImageList = await downloader.syncAll(cupIpList);
        for (const cup of cupImageList) {
            await mongo.addImages(cup);
        }
    }, 10*1000);

}

start();
