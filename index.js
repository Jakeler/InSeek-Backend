const mongo = require('./mongo');
const mqtt = require('./mqtt');
const downloader = require('./download');

mqtt.init();
mongo.setupDB();

let ipList = ["10.42.0.166"];
// downloader.syncAll(ipList);


const intervalId = setInterval(async () => {
}, 3000);
