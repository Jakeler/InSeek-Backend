const tf = require("@tensorflow/tfjs-node");
const knnClassifier = require("@tensorflow-models/knn-classifier");
const sharp = require("sharp");
const fs = require("fs-extra");

//--------------- EXPORTED HELPER FUNCTIONS ---------------

/**
 * Classifies a image with passed model and returns the predicted logits.
 * 
 * @param  model          the model (MobileNet) that should classify the image.
 * @param  imgPath        the filePath of the image that should be classified.
 * @param  imageToTensor  the function which converts the image to a for the model usable tensor.
 * 
 * @return logits tensor.
 */
exports.classifyImage = async (model, imgPath, imageToTensor) => {
    // convert image to for model usable tensor
    const input = await imageToTensor(imgPath);

    // return predicted logits
    return await model.predict(input);  // TODO: with this always 100% certainty for prediction!? not the case with mobileNet library

    // const input = tf.tensor3d(rawImgBuf, [imgHeight, imgWidth, imgChannels], "int32");
// console.log(await model.classify(input));
    // return model.infer(input);
    // return model.infer(input, "conv_preds");    // TODO: what is embedding?
}

/**
 * Converts an image to a tf.tensor which MobileNet is able to classify.
 * 
 * @param  imgPath  the filePath of the image that should be converted.
 * 
 * @return the converted tf.tensor3d.
 */
exports.imageToTensorMobileNet = async imgPath => {
    const IMAGE_SIZE           = 224;   // NOTE: width and height of image need to match
    const IMAGE_CHANNELS       = 3;
    const NORMALIZATION_OFFSET = tf.scalar(127.5);

    // load image from filePath
    const img = await sharp(imgPath)
                        .removeAlpha(); // in case image has alpha channel remove it

    // resize image and convert it to raw buffer
    const rawImgBuf = await img
                            .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "fill" }) // TODO: changing fit changes results. "Cover" best? in examples "fill" is used
                            .raw()
                            .toBuffer(); // TODO: needed?

    // create normalized and reshaped tensor from image
    const input = tf.tensor3d(rawImgBuf, [IMAGE_SIZE, IMAGE_SIZE, IMAGE_CHANNELS], "int32")
                        .toFloat()
                        .sub(NORMALIZATION_OFFSET) // NOTE: normalize 0-255 to -1-1
                        .div(NORMALIZATION_OFFSET)
                            // .resizeNearestNeighbor([IMAGE_SIZE, IMAGE_SIZE]) // TODO: completely different results, when bilinear alignCorners is set
                            // .resizeBilinear([IMAGE_SIZE, IMAGE_SIZE], true) // TODO: better results? but more expensive calculation. What does alignCorners do? Where to resize? before or after normalization?
                        .reshape([-1, IMAGE_SIZE, IMAGE_SIZE, IMAGE_CHANNELS]); // TODO:  -1 or 1?

    // TODO: needed? done in mobilenet library, but not working
    // Remove the very first logit (background noise).
    // result = logits.slice([0, 1], [-1, 1000]);

    return input;
}

/**
 * Stores KNN-Classifier dataset to specified filePath.
 * 
 * @param  classifier  the classifier whose dataset should be stored.
 * @param  dest        the destination at which the dataset should be stored.
 * 
 * @return Promise which resolves after KNN-Classifier was stored in file system.
 */
// NOTE: taken and slightly changed from https://github.com/tensorflow/tfjs/issues/633#issuecomment-475973106
exports.saveKnnClassifier = async (classifier, dest) => {
    const dataset = classifier.getClassifierDataset();
    const datasetOjb = await toDatasetObject(dataset);
    const jsonStr = JSON.stringify(datasetOjb);

    await fs.outputFile(dest, jsonStr);
}

/**
 * Loads stored KNN-Classifier from file system.
 * 
 * @param  path  path to the store KNN-Classifier dataset.
 * 
 * @return KNN-Classifier with loaded dataset.
 */
// NOTE: taken and slightly changed from https://github.com/tensorflow/tfjs/issues/633#issuecomment-475973106
exports.loadKnnClassifier = async path => {
    const classifier = knnClassifier.create();

    const datasetJson = await fs.readFile(path);

    if(datasetJson) {
      const datasetObj = JSON.parse(datasetJson);

      const dataset = fromDatasetObject(datasetObj);

      classifier.setClassifierDataset(dataset);
    }

    return classifier;
}


//--------------- PRIVATE HELPER FUNCTIONS ---------------

/**
 * Converts KNN-Classifier dataset to storable.
 * 
 * @param  dataset  the KNN-Classfier dataset that should be converted.
 * 
 * @return Promise which resolves to the converted dataset object.
 */
// NOTE: taken and slightly changed from https://github.com/tensorflow/tfjs/issues/633#issuecomment-475973106
const toDatasetObject = async dataset => {
    const result = await Promise.all(
        Object.entries(dataset).map(async ([classId,value], index) => {
            const data = await value.data();

            return {
                classId: classId,
                data: Array.from(data),
                shape: value.shape
            };
        })
    );

    return result;
};

/**
 * Converts stored KNN-Classifier datasetObject to for KNN-Classifier usable dataset.
 * 
 * @param  datasetObject  the datasetObject that should be converted.
 * 
 * @return the converted dataset.
 */
// NOTE: taken and slightly changed from https://github.com/tensorflow/tfjs/issues/633#issuecomment-475973106
const fromDatasetObject = datasetObject => {
    return Object.entries(datasetObject).reduce((result, [indexString, {classId, data, shape}]) => {
        const tensor = tf.tensor2d(data, shape);

        // TODO: better to use index than subject name?
        // const index = Number(indexString);
        const index = classId;

        result[index] = tensor;

        return result;
    }, {});
}