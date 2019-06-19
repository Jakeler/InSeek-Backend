const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
const mongoUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'inseek';

const connect = () => new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, client) => {
    if (err != null) {
      reject(err);
    } else {
      console.log("Connected successfully to mongo server");
      resolve(client);
    }
  });
});


const setupDB = async () => {
  const client = await connect();
  
  const db = client.db(dbName);
  let collection = db.collection('Meins');
  
  collection.insertOne({ich: 'nicht geilo', du: 'geilo'});
  collection.find({}).toArray((err, docs) => {
    console.log(docs);
    client.close();
  })  
}

module.exports = {connect, setupDB}