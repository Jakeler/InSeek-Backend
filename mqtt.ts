import {Server} from 'mosca'

export function init() {
    const server: Server = new Server({port: 2222}, () => {
        console.log('Mosca MQTT server is up and running');
    });

    server.on('clientConnected', (client) => {
        console.log('client connected', client.id);
    });

    // fired when a message is received
    server.on('published', (packet, client) => {
    console.log('Published', packet.payload);
    });
}
