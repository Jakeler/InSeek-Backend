import * as express from 'express';
import {getCups, getImg} from './mongo';
import { loggerGenerator, SubSystem } from './logger';
const log = loggerGenerator(SubSystem.API);

const app = express();

type ExpressHandler = (req: express.Request, res: express.Response) => void;

const catcher = (func: ExpressHandler) => 
    async (req: express.Request, res: express.Response) => {
        try {
            await func(req, res);
        } catch (error) {
            log.err('Request failed: ' + error);
            res.sendStatus(500);
        }
    }

export function start() {    
    app.use((req, res, next) => {
        log.info(`Received ${req.method} ${req.originalUrl}`)
        next();
    });
        
    /**
     * Get list of cups, defaults to all without param, for specific suitcase use: /cup/list?suitcase=ID
    [
        {
            "_id": "5d1232de0392941500009ebc",
            "suitcase": "5d1232de0392941500009ebb",
            "ip": "10.42.0.166",
            "friendlyName": "Die lustige Libelle Lotta"
        },
        {
            "_id": "5d1232de0392941500009ebd",
            "suitcase": "5d1232de0392941500009ebb",
            "ip": "10.0.0.36",
            "friendlyName": "Die lustige Libelle Lotta 2"
        }
    ]
     */
    app.get('/cup/list', catcher(async (req, res) => {
        res.json(await getCups(req.query.suitcase));
    }));
    
    /**
     * Get list of images, defaults to all without param, for specific cup use: /image/list?cup=ID
    [
        {
            "_id": "5d12337e0392941500009ebe",
            "timestamp": 1561473918867,
            "suchgangID": "xyz",
            "cupID": "5d1232de0392941500009ebc",
            "imagePath": "images/2d595255.jpg",
            "determinedInsectID": null,
            "predictedInsectIDs": []
        },
        {
            "_id": "5d12337e0392941500009ebf",
            "timestamp": 1561473918867,
            "suchgangID": "xyz",
            "cupID": "5d1232de0392941500009ebc",
            "imagePath": "images/17ccfce9.jpg",
            "determinedInsectID": null,
            "predictedInsectIDs": []
        },
    ]
     */
    app.get('/image/list', catcher(async (req, res) => {
        res.json(await getImg(req.query.cup));
    }));
    /**
     * Get saved images with id: /images/ID.jpg
     */
    app.use('/images/', express.static('images/'));

    
    app.listen(3000, function () {
        log.info('REST API server listening on port 3000!');
    });
}
  