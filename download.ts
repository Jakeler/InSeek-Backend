const fs = require("fs");
const http = require("http");


const download = (url: string, path: string) => 
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
    console.log("DONE", index);
      
  }
  console.log(files);
  return files;
}

const sync = async (ip: string): Promise<string[]> => {
  const countBuffer = await checkStorage(ip);
  const count = parseInt(countBuffer.toString());
  if (count === 0) {
    console.log('Nothing to sync');
    return;
  }
  console.log('Available images =', count);
  
  const filePaths = await downloadAll(ip, count);
  console.log('Downloaded all');
  await wipeStorage(ip);
  console.log('Storage clear');
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
  console.log('Started sync');

  const result: cupImages[] = [];
  for (const cup of cupIPs) {
    try {
      result.push({
        _id: cup._id,
        filePaths: await sync(cup.ip),
      });
      console.log('Synced cup at', cup);
    } catch (error) {
      console.error('Unable to sync', cup);
    }
  }
  return result;
}

export {syncAll}; 