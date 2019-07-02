import { MongoClient, Db, ObjectId } from "mongodb";

import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.MONGO);

import { insectMetadata, genCupList, suitcaseData } from "./exampleData";

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

  await addImage('asdfghjkl', 'abcd');

  await addInsectData();
}

/**
 * Insert example cups
 */
const addCups = (db: Db, suitcaseID: string) => new Promise((resolve, reject) => {
  db.collection('cup').insertMany(genCupList(suitcaseID), (err, result) => {
    if (err) reject(reject);
    resolve();
    log.info('Cups included');
  });
});

/**
 * Insert example suitcase
 */
const addSuitcase = (db: Db) => new Promise<string>((resolve, reject) => {
  db.collection('suitcase').insertOne(suitcaseData, (err, result) => {
    if (err) reject(reject);
    log.info('Suitcase included');
    resolve(result.ops[0]._id)
  });
});


/**
 * Insert image metadata after download
 */
export const addImage = (cupId: string, path: string, predInsects: string[]) => new Promise((resolve, reject) => {
  const data = {
    timestamp: Date.now(),
    suchgangID: 'xyz',
    cupID: cupId,
    imagePath: path,
    determinedInsectID: null, //reviewed insect IDs
    predictedInsectIDs: predInsects,
  }
  globalDb.collection('image').insertOne(data, (err, result) => {
    if (err) reject(reject);
    log.info(`Added ${path} from "${cupId}"`);
    resolve();
  });
})

const addInsectData = () => 
  globalDb.collection('insects').insertMany(insectMetadata);


export const getInsects = () =>
  globalDb.collection('insects').find({})
  .toArray()


export const getCupIpList = () => 
  globalDb.collection('cup')
    .find({}, {projection: {ip: true}})
    .toArray();

export const getSuitcases = () => 
  globalDb.collection('suitcase')
    .find({})
    .toArray();

export const getCups = (suitcase?: string) => 
  globalDb.collection('cup')
    .find(suitcase? {suitcase: new ObjectId(suitcase)} : {})
    .toArray();

export const getImages = (cup?: string) => 
  globalDb.collection('image')
    .find(cup? {cupID: new ObjectId(cup)} : {})
    .toArray();

export const confirmImg = (imageID: string, insectID: string) => 
  globalDb.collection('image').updateOne(
    {_id: new ObjectId(imageID)},
    {$set: {determinedInsectID: insectID}});


export const getImgCount = (cup?: string) => 
  globalDb.collection('image')
    .count(cup? {cupID: new ObjectId(cup)} : {})



  