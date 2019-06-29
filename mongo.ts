import { MongoClient, Db, ObjectId } from "mongodb";

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
      syncStatus: "finished",
    }, {
      suitcase: suitcaseID,
      ip: '127.0.0.1',
      friendlyName: 'Die lokale Libelle Lotta',
      syncStatus: "finished",
    }, 
    ...(Array.apply(null, {length: 10})).map(() => (
      {
        ip: "0.0.0.0",
        syncStatus: "pending",
      }))
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
    location: "Taubental",
    date: Date.now(),
    allImagesSynced: true,
  }, (err, result) => {
    if (err) reject(reject);
    log.info('Suitcase included');
    resolve(result.ops[0]._id)
  });
});

export const getCupIpList = 
  () => globalDb.collection('cup')
    .find({}, {projection: {ip: true}})
    .toArray();

/**
 * Insert image metadata after download
 */
export const addImages = (cupId: string, path: string) => new Promise((resolve, reject) => {
  const data = {
      timestamp: Date.now(),
      suchgangID: 'xyz',
      cupID: cupId,
      imagePath: path,
      determinedInsectID: null, //reviewed insect IDs
      predictedInsectIDs: [],
    }
  globalDb.collection('image').insertOne(data, (err, result) => {
    if (err) reject(reject);
    log.info(`Added ${path} from "${cupId}"`);
    resolve();
  });
})

export const getSuitcases = () => 
  globalDb.collection('suitcase')
    .find({})
    .toArray();

export const getCups = (suitcase?: string) => 
  globalDb.collection('cup')
    .find(suitcase? {suitcase: new ObjectId(suitcase)} : {})
    .toArray();

export const getImg = (cup?: string) => 
  globalDb.collection('image')
    .find(cup? {cupID: new ObjectId(cup)} : {})
    .toArray();
  
export const getImgCount = (cup?: string) => 
  globalDb.collection('image')
    .count(cup? {cupID: new ObjectId(cup)} : {})


  