const mosca = require('mosca');

function init() {
    const server = new mosca.Server({port: 2222});

    server.on('clientConnected', (client) => {
        console.log('client connected', client.id);
    });

    // fired when a message is received
    server.on('published', (packet, client) => {
    console.log('Published', packet.payload);
    });

    server.on('ready', () => {
        console.log('Mosca MQTT server is up and running');
    });
}

module.exports = {init}
