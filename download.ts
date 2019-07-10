import * as fs from 'fs';
import * as http from 'http';
const options: http.RequestOptions = {
  timeout: 20000,
}

import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.DL);

import { addImage } from "./mongo";
import * as ki from './ki';


const download = (url: string, path: string) => 
new Promise((resolve, reject) => {
  log.info(`Downloading from ${url} to ${path}`);
  
  http.get(url, options, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`)
    } else {
      const file = fs.createWriteStream(path);
      response.pipe(file);
      file.on('finish', () => {
        file.close()
        resolve();
      });
      file.on('error', reject);
    }
  }).on('error', reject).on('timeout', () => reject('TIMEOUT'));
});

const checkStorage = (ip: string) => 
new Promise<Buffer>((resolve, reject) => {
  http.get(`http://${ip}/storage/img_count`, options, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', (chunk: Buffer) => resolve(chunk));
    }
  }).on('error', reject).on('timeout', () => reject('TIMEOUT'));
});

const deleteStorage = (ip: string, index: number) => 
new Promise<Buffer>((resolve, reject) => {
  http.get(`http://${ip}/storage/delete?id=${index}`, options, response => {
    if(response.statusCode !== 200) {
      reject(`${response.statusCode} ${response.statusMessage}`);
    } else {
      response.on('data', (chunk: Buffer) => resolve(chunk));
      log.info(`Deleted image with index ${index}`);
    }
  }).on('error', reject).on('timeout', () => reject('TIMEOUT'));
});


const sync = async (cup: cupIP): Promise<string[]> => {
  const countBuffer = await checkStorage(cup.ip);
  const count = parseInt(countBuffer.toString());
  if (count === 0) {
    log.info('Nothing to download');
    return [];
  }
  log.info(`${cup._id}: found ${count} available images`);
  
  for (let index = count-1; index >= 0; index--) {
    let imgId = index;
    let url = `http://${cup.ip}/storage/img?id=${imgId}`
    let fileId = (Math.floor(Math.random()*0xFFFFFFFF)).toString(16);
    let path = `images/${fileId}.jpg`;
  
    await download(url, path);
    const pred = fs.statSync(path).size == 0? ['NO-IMAGE'] : await ki.classify(path);
    log.info('Determined insect = '+pred[0]);
    await addImage(cup._id, path, pred);
    await deleteStorage(cup.ip, index);
  }
}

export interface cupIP {
  _id: string,
  ip: string,
}


const syncAll = async (cupIPs: cupIP[]): Promise<void> => {
  log.info('Beginning sync...');

  for (const cup of cupIPs) {
    try {
      const paths = await sync(cup);
      log.info(`=> Synced cup ${cup._id} from ${cup.ip}`);
    } catch (error) {
      log.err(`=> Unable to sync ${cup._id}: ${error}`);
    }
  }

  log.info('Sync all complete!')
}

export {syncAll}; 