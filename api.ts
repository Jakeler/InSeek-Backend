import * as express from 'express';
import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.API);

const app = express();

export function start() {    
    app.use((req, res, next) => {
        log.info(`Received ${req.method} ${req.originalUrl}`)
        next();
    });
    
    app.use('/images/', express.static('images/'));
    

    app.get('/test', function (req, res) {
        res.send('Hello World!');
    });
    
    app.listen(3000, function () {
        log.info('REST API server listening on port 3000!');
    });
}
  