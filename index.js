const mongo = require('./mongo');
const mqtt = require('./mqtt');
const downloader = require('./download');

// mqtt.init();
mongo.setupDB();

let ipList = ["10.42.0.166"];

const intervalId = setInterval(async () => {
    // downloader.syncAll(ipList);
}, 3000);
