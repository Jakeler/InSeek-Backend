import {Server} from 'mosca'
import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.MQTT);

export function init() {
    const server: Server = new Server({port: 2222}, () => {
        log.info('Mosca MQTT server is up and running');
    });

    server.on('clientConnected', (client) => log.info(`"${client.id}" connected`));
    server.on('clientDisconnected', (client) => log.info(`"${client.id}" disconnected`));
    
    server.on('subscribed', (packet, client) => log.info(`"${client.id}" subscribed to ${packet}`))

    // fired when a message is received
    server.on('published', (packet, client) => {
        if (!packet.topic.startsWith('$SYS')) { // filter out sys messages
            log.info(`"${client.id}" published ${packet.payload} in ${packet.topic}`);
        }
    });
}
