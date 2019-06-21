import {Server} from 'mosca'
import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.MQTT);

export function init() {
    const server: Server = new Server({port: 2222}, () => {
        log.info('Mosca MQTT server is up and running');
    });

    server.on('clientConnected', (client) => {
        log.info('client connected ' + client.id);
    });

    // fired when a message is received
    server.on('published', (packet, client) => {
    log.info('Published ' + packet.payload);
    });
}
