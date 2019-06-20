import * as mongo from './mongo';
import * as mqtt from "./mqtt";
import * as downloader from './download';

mqtt.init();
mongo.setupDB();

let ipList = ["10.42.0.166"];

const intervalId = setInterval(async () => {
    downloader.syncAll(ipList);
}, 3000);
