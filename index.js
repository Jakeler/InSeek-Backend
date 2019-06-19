const mosca = require('mosca');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
const mongoUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'inseek';


const server = new mosca.Server({port: 2222});

server.on('clientConnected', (client) => {
    console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', (packet, client) => {
  console.log('Published', packet.payload);
});

server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running');
}



const connectMongo = () => new Promise((resolve, reject) => {
  MongoClient.connect(mongoUrl, (err, client) => {
    if (err != null) {
      reject(err);
    } else {
      console.log("Connected successfully to mongo server");
      resolve(client);
    }
  });
});


const setupMongo = async () => {
  const client = await connectMongo();
  
  const db = client.db(dbName);
  let collection = db.collection('Meins');
  
  collection.insertOne({ich: 'nicht geilo', du: 'geilo'});
  collection.find({}).toArray((err, docs) => {
    console.log(docs);
    client.close();
  })
  
}

setupMongo()

const downloader = require('./download')

let ipList = ["10.42.0.166"];

// downloader.syncAll(ipList);


const intervalId = setInterval(async () => {
}, 3000);
