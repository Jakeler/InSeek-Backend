const fetch = require("node-fetch");
const fs = require("fs-extra");
const path = require("path");

// https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
require('https').globalAgent.options.rejectUnauthorized = false;    // TODO: should be removed because it's possibly dangerous, but needed to fetch all images (else downloading images from 'www.zoology.ubc.ca' fails)


/**
 * Fetches JSON from specified url.
 * 
 * @param  url  the url to which the request should be made.
 * 
 * @return Promise which resolves to parsed json response
 *         if no error was thrown.
 */
exports.getJSONData = async (url, options) => {
    try {
        // make request to specified url
        const response = await fetch(url, options);
        // parse response to JSON
        const parsedJSON = await response.json();

        return parsedJSON;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Downloads file from specified url to specified destination.
 * 
 * @param  url   the url to which the request should be made.
 * @param  dest  the destination at which the file should be stored.
 * 
 * @return Promise which resolves to the destination
 *         at which the file was stored if no error was thrown.
 */
exports.downloadFile = async (url, dest) => {
    try {
        // make request to specified url
        const response = await fetch(url);

        // ensure that directory to which file should be stored exist.
        // If it doesn't exist create it
        await fs.ensureDir(path.dirname(dest));

        // open fileStream to destination path
        const fileStream = fs.createWriteStream(dest);

        process.stdout.write(`downloading file '${ dest }'...`);

        // write file to specified destination
        await new Promise((resolve, reject) => {
            response.body.pipe(fileStream);

            // reject if something went wrong
            response.body.on("error", (err) => {
                reject(err);
            });

            // resolve if finished without error
            fileStream.on("finish", () => {
                console.log("success!");
                resolve();
            });
        });

        return dest;
    } catch (error) {
        console.log(error);
    }
}