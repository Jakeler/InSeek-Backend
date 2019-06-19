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

let ip = "10.42.0.166";
let maxImgId = 3;

const syncAll = async () => {
  const countBuffer = await checkStorage(ip);
  const count = parseInt(countBuffer);
  console.log('Not synced images', count);
  if (count === 0) return;

  try {
    await downloadAll(ip, count);
    console.log('Downloaded all');
    await wipeStorage(ip);
    console.log('Storage clear');
  } catch (error) {
    console.error(error);
  }
}

syncAll();

// downloadAll(ip, maxImgId);