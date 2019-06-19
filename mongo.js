const MongoClient = require('mongodb').MongoClient;
const Db = require('mongodb').Db;

const assert = require('assert');
// Connection URL
const mongoUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'inseek';

/**
 * @type {MongoClient}
 */
let globalClient;
/**
 * @type {Db}
 */
let globalDb;

/**
 * Open a new connection
 * @returns {MongoClient}
 */
const connect = () => new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, client) => {
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
const setupDB = async () => {
  await connect();
  globalDb.dropDatabase();

  const id = await addSuitcase(globalDb);
  await addCups(globalDb, id);

  await addImages(globalDb, 'ficker', ['abcd', 'defg', 'foo', 'bar']);
  
  globalClient.close();  
}

/**
 * Insert example cups
 * @param {Db} db 
 * @param {String} suitcaseID 
 */
const addCups = (db, suitcaseID) => new Promise((resolve, reject) => {
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
 * @param {Db} db 
 */
const addSuitcase = (db) => new Promise((resolve, reject) => {
  db.collection('suitcase').insertOne({
    state: 'perfect',
    distributedTo: 'HfG',
  }, (err, result) => {
    if (err) reject(reject);
    console.log('Suitcase included');
    resolve(result.ops[0]._id)
  });
});

/**
 * Insert image metadata after download
 * @param {string} cupID
 * @param {string[]} imagePaths 
 */
const addImages = (db, cupID, imagePaths) => new Promise((resolve, reject) => {
  const data = imagePaths.map(path => ({
      timestamp: Date.now(),
      suchgangID: 'xyz',
      cupID:cupID,
      imagePath: path,
      determinedInsectID: null, //reviewed insect ids?
      predictedInsectIDs: [],
    }
  ))

  db.collection('image').insertMany(data, (err, result) => {
    if (err) reject(reject);
    console.log(`Added ${imagePaths.length} images from "${cupID}"`);
    resolve();
  });
})



module.exports = {connect, setupDB}