// TODO: tf.tidy() needed on tfjs-node?
// TODO: model warmup needed in tfjs-node?
// TODO: check where await is really necessary
// TODO: add try-catch-blocks where necessary

// imports for tensorflow
const tf = require("@tensorflow/tfjs-node");

// custom imports
const { classifyImage, loadKnnClassifier, imageToTensorMobileNet } = require("./utils/mlUtils");

exports.loadInsectIdentifier = async () => {
    try {
        // load locally downloaded mobileNet model
        const mobileNet     = await tf.loadLayersModel(tf.io.fileSystem("./ki/mobileNet/model.json"));

        // load saved trained knnClassifier
        const knnClassifier = await loadKnnClassifier("./ki/trainedKNNClassifier.json");

        return new InsectIdentifier(mobileNet, knnClassifier);
    } catch(error) {
        console.log("Failed to load models: ", error);
    }
}

class InsectIdentifier {
    constructor(mobileNet, knnClassifier) {
        this.mobileNet     = mobileNet;
        this.knnClassifier = knnClassifier;
        this.imageToTensor = imageToTensorMobileNet;

        // bindings
        this.classifyInesct = this.classifyInsect.bind(this);
    }

    // TODO: not working as arrow function
    async classifyInsect(imagePath){
        try {
            // classify Image with mobilNet
            const logits = await classifyImage(this.mobileNet, imagePath, this.imageToTensor);

            // classify logits with trained knn-classifier
            // TODO: make k value global?
            return await this.knnClassifier.predictClass(logits, 10);
        } catch(error) {
            console.log("Failed to classify insect: ", error);
            return null;
        }
    }
}
