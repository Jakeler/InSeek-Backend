import { MongoClient, Db } from "mongodb";
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
      console.log("Connected successfully to mongo server");
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

  await addImages('ficker', ['abcd', 'defg', 'foo', 'bar']);
  
  globalClient.close();  
}

/**
 * Insert example cups
 */
const addCups = (db: Db, suitcaseID: string) => new Promise((resolve, reject) => {
  db.collection('cup').insertMany([
    {
      suitcase: suitcaseID,
      ip: '10.0.0.10',
      friendlyName: 'Die lustige Libelle Lotta',
    }, {
      suitcase: suitcaseID,
      ip: '10.0.0.11',
      friendlyName: 'Die lustige Libelle Lotta 2',
    },
  ], (err, result) => {
    if (err) reject(reject);
    const ids = result.ops.map(obj => obj._id);
    resolve(ids);
    console.log('Cups included');
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
    console.log('Suitcase included');
    resolve(result.ops[0]._id)
  });
});

export const getCupIpList = 
  () => globalDb.collection('cup').find({}, {projection: {ip: true}}).toArray();

/**
 * Insert image metadata after download
 */
export const addImages = (cupID: string, imagePaths: string[]) => new Promise((resolve, reject) => {
  const data = imagePaths.map(path => ({
      timestamp: Date.now(),
      suchgangID: 'xyz',
      cupID:cupID,
      imagePath: path,
      determinedInsectID: null, //reviewed insect ids?
      predictedInsectIDs: [],
    }
  ))

  globalDb.collection('image').insertMany(data, (err, result) => {
    if (err) reject(reject);
    console.log(`Added ${imagePaths.length} images from "${cupID}"`);
    resolve();
  });
})

