const fs = require("fs");
const http = require("http");

import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.DL);


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

const downloadAll = async (ip: string, imgCount: number): Promise<string[]> => {
  const files: string[] = [];

  for (let index = 0; index < imgCount; index++) {
    let imgId = index;
    let url = `http://${ip}/storage/img?id=${imgId}`
    let fileId = (Math.floor(Math.random()*0xFFFFFFFF)).toString(16);
    let path = `images/${fileId}.jpg`;
  
    await download(url, path);
    files.push(path);
    log.info("DONE " + index);
      
  }
  log.info(files);
  return files;
}

const sync = async (ip: string): Promise<string[]> => {
  const countBuffer = await checkStorage(ip);
  const count = parseInt(countBuffer.toString());
  if (count === 0) {
    log.info('Nothing to download');
    return [];
  }
  log.info('Available images = ' + count);
  
  const filePaths = await downloadAll(ip, count);
  log.info('Downloaded all');
  await wipeStorage(ip);
  log.info('Storage clear');
  return filePaths;
}

export interface cupIP {
  _id: string,
  ip: string,
}

export interface cupImages {
  _id: string,
  filePaths: string[],
}

const syncAll = async (cupIPs: cupIP[]): Promise<cupImages[]> => {
  log.info('Started sync');

  const result: cupImages[] = [];
  for (const cup of cupIPs) {
    try {
      const paths = await sync(cup.ip);
      if (paths.length > 0)
        result.push({
          _id: cup._id,
          filePaths: paths,
        });
      log.info(`Synced cup ${cup._id} from ${cup.ip}`);
    } catch (error) {
      log.err(`Unable to sync ${cup._id} from ${cup.ip}`);
    }
  }
  return result;
}

export {syncAll}; 