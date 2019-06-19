const fs = require("fs");
const http = require("http");


const download = (url, path) => 
new Promise((resolve, reject) => {
  console.log('Downloading from', url, 'to', path);
  
  http.get(url, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`)
    } else {
      const file = fs.createWriteStream(path);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }
  });
});

const checkStorage = (ip) => 
new Promise((resolve, reject) => {
  http.get(`http://${ip}/storage/img_count`, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', chunk => resolve(chunk));
    }
  }).on('error', reject);
});

const wipeStorage = (ip) => 
new Promise((resolve, reject) => {
  http.get(`http://${ip}/storage/wipe`, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', chunk => resolve(chunk));
    }
  }).on('error', reject);
});

const downloadAll = async (ip, imgCount) => {
  const files = [];

  for (let index = 0; index < imgCount; index++) {
    let imgId = index;
    let url = `http://${ip}/storage/img?id=${imgId}`
    let fileId = (Math.floor(Math.random()*0xFFFFFFFF)).toString(16);
    let path = `images/${fileId}.jpg`;
  
    await download(url, path);
    files.push(path);
    console.log("DONE", index);
      
  }

  console.log(files);
}

const sync = async (ip) => {
  const countBuffer = await checkStorage(ip);
  const count = parseInt(countBuffer);
  if (count === 0) {
    console.log('Nothing to sync');
    return;
  }
  console.log('Not synced images', count);
  
  try {
    await downloadAll(ip, count);
    console.log('Downloaded all');
    await wipeStorage(ip);
    console.log('Storage clear');
  } catch (error) {
    console.error(error);
  }
}

const syncAll = async (ipList) => {
  console.log('Started sync');
  for (const ip of ipList) {
    await sync(ip);
    console.log('Synced cup at', ip);
  }
}

module.exports = {syncAll}; 