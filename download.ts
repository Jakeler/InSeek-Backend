const fs = require("fs");
const http = require("http");

import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.DL);

import { addImages } from "./mongo";


const download = (url: string, path: string) => 
new Promise((resolve, reject) => {
  log.info(`Downloading from ${url} to ${path}`);
  
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

const checkStorage = (ip: string) => 
new Promise<Buffer>((resolve, reject) => {
  http.get(`http://${ip}/storage/img_count`, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', (chunk: Buffer) => resolve(chunk));
    }
  }).on('error', reject);
});

const wipeStorage = (ip: string) => 
new Promise<Buffer>((resolve, reject) => {
  http.get(`http://${ip}/storage/wipe`, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', (chunk: Buffer) => resolve(chunk));
    }
  }).on('error', reject);
});


const sync = async (cup: cupIP): Promise<string[]> => {
  const countBuffer = await checkStorage(cup.ip);
  const count = parseInt(countBuffer.toString());
  if (count === 0) {
    log.info('Nothing to download');
    return [];
  }
  log.info('Available images = ' + count);
  
  for (let index = 0; index < count; index++) {
    let imgId = index;
    let url = `http://${cup.ip}/storage/img?id=${imgId}`
    let fileId = (Math.floor(Math.random()*0xFFFFFFFF)).toString(16);
    let path = `images/${fileId}.jpg`;
  
    await download(url, path);
    await addImages(cup._id, path);
    // delete
  }
  log.info('Downloaded all');

  await wipeStorage(cup.ip);
  log.info('Storage clear');
}

export interface cupIP {
  _id: string,
  ip: string,
}


const syncAll = async (cupIPs: cupIP[]): Promise<void> => {
  log.info('Started sync');

  for (const cup of cupIPs) {
    try {
      const paths = await sync(cup);
      log.info(`Synced cup ${cup._id} from ${cup.ip}`);
    } catch (error) {
      log.err(`Unable to sync ${cup._id}: ${error}`);
    }
  }
}

export {syncAll}; 