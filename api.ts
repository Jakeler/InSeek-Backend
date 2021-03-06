import * as express from 'express';
import * as cors from "cors";
import {getSuitcases, getCups, getImages, getImgCount, confirmImg, getInsects} from './mongo';
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

    app.use(cors());

    app.use(express.json()); // Parses JSON body for POST
    
    /**
     * Get list of suitcases
     */
    app.get('/suitcase', catcher(async (req, res) => {
        const data = await getSuitcases();
        res.json(data[0]);
    }));


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
        const data = await getCups(req.query.suitcase);
        for (const elm of data) {
            elm["imageCount"] = await getImgCount(elm._id);
        }
        res.json(data);
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
        res.json(await getImages(req.query.cup));
    }));

    /**
     * Send a POST request to /image/IMAGE-ID/confirm 
     * with {determinedInsectID: 'ID'} as json  body.
     * IMAGE-ID must be the full database id (not the file/path id)
     * Responds on success with:
        {
            "n": 1,
            "nModified": 1,
            "ok": 1
        }
     */
    app.post('/image/:imageID/confirm', catcher(async (req, res) => {
        const data = await confirmImg(req.params.imageID, req.body.determinedInsectID);
        log.info(req.body);
        res.json(data.result);
    }));

    /**
     * Get saved images with id: /images/ID.jpg
     */
    app.use('/images/', express.static('images/'));

    /**
     * Responds with insect info Array:
        [
            {
                "_id": "5d1a921b43e2a123915c1356",
                "name": "Asiatischer Marienkäfer",
                "scientificName": "harmonia axyridis",
                "imageUrl": "https://tse3.mm.bing.net/th?id=OIP.52yrurvf7kuZkNYnbu2B1AHaGW&pid=Api",
                "extract": "Der Asiatische Marienkäfer ist ein Käfer aus der Familie der Marienkäfer (Coccinellidae)."
            },
            ...
        ]
     */
    app.get('/insect/list', catcher(async (req, res) => {
        res.json(await getInsects());
    }))

    
    app.listen(3000, function () {
        log.info('REST API server listening on port 3000!');
    });
}
  