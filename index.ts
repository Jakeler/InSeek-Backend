import * as mongo from './mongo';
import * as mqtt from "./mqtt";
import * as downloader from './download';
import * as api from './api';
import { loggerGenerator, SubSystem } from './logger';

async function start() { // Top level await
    await mqtt.init();
    await mongo.connect();
    await api.start();

    // await mongo.setupDB(); //run this only once
    
    let cupIpList = await mongo.getCupIpList();
    loggerGenerator(SubSystem.DL).info(`Existing cups: \n${JSON.stringify(cupIpList, null, 2)}`);

    while(true) {
        await downloader.syncAll(cupIpList);
        await awaiter(10*1000);
    }
}

const awaiter = (ms: number) => new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
})

start();
