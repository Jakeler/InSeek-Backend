const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
const mongoUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'inseek';

let globalClient;

const connect = () => new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, client) => {
    if (err != null) {
      reject(err);
    } else {
      console.log("Connected successfully to mongo server");
      globalClient = client;
      resolve(client);
    }
  });
});


const setupDB = async () => {
  const client = await connect();  
  const db = client.db(dbName);

  const id = await addSuitcase(db);
  await addCups(db, id);

  
  client.close();  
}


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

const addImages = (cupIDs, imagePaths) => new Promise((resolve, reject) => {
  db.collection('image').insertMany([
    {
      timestamp: Date.now(),
      suchgangID: 'xyz',
      cupId:cupIDs,
      imagePath: imagePaths,
      determinedInsectID: null, //reviewed insect ids?
      predictedInsectIDs: [],
    }
    
  ], (err, result) => {
    if (err) reject(reject);
    resolve();
  });
})



module.exports = {connect, setupDB}