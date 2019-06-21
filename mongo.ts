import { MongoClient, Db } from "mongodb";
import { cupImages } from './download';

import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.MONGO);

// Connection URL
const mongoUrl = 'mongodb://t440s-arch:27017';
// Database Name
const dbName = 'inseek';

let globalClient: MongoClient;
let globalDb: Db;

/**
 * Open a new connection
 */
export const connect = () => new Promise<MongoClient>((resolve, reject) => {
  MongoClient.connect(mongoUrl, {useNewUrlParser: true},(err, client) => {
    if (err != null) {
      reject(err);
    } else {
      log.info("Connected successfully to mongo server");
      globalClient = client;
      globalDb = client.db(dbName);
      resolve(client);
    }
  });
});

/**
 * Initialize DB with some example data
 */
export const setupDB = async () => {
  globalDb.dropDatabase();

  const id = await addSuitcase(globalDb);
  await addCups(globalDb, id);

  // await addImages({_id: 'asdfghjkl', filePaths: ['abcd', 'defg', 'foo', 'bar']});
}

/**
 * Insert example cups
 */
const addCups = (db: Db, suitcaseID: string) => new Promise((resolve, reject) => {
  db.collection('cup').insertMany([
    {
      suitcase: suitcaseID,
      ip: '10.42.0.166',
      friendlyName: 'Die lustige Libelle Lotta',
    }, {
      suitcase: suitcaseID,
      ip: '10.0.0.36',
      friendlyName: 'Die lustige Libelle Lotta 2',
    },
  ], (err, result) => {
    if (err) reject(reject);
    resolve();
    log.info('Cups included');
  });
});

/**
 * Insert example suitcase
 */
const addSuitcase = (db: Db) => new Promise<string>((resolve, reject) => {
  db.collection('suitcase').insertOne({
    state: 'perfect',
    distributedTo: 'HfG',
  }, (err, result) => {
    if (err) reject(reject);
    log.info('Suitcase included');
    resolve(result.ops[0]._id)
  });
});

export const getCupIpList = 
  () => globalDb.collection('cup').find({}, {projection: {ip: true}}).toArray();

/**
 * Insert image metadata after download
 */
export const addImages = (cupImages: cupImages) => new Promise((resolve, reject) => {
  const data = cupImages.filePaths.map(path => ({
      timestamp: Date.now(),
      suchgangID: 'xyz',
      cupID: cupImages._id,
      imagePath: path,
      determinedInsectID: null, //reviewed insect ids?
      predictedInsectIDs: [],
    }
  ))

  globalDb.collection('image').insertMany(data, (err, result) => {
    if (err) reject(reject);
    log.info(`Added ${cupImages.filePaths.length} images from "${cupImages._id}"`);
    resolve();
  });
})

