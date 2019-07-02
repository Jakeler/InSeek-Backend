const {loadInsectIdentifier} = require('../ki/index');

let model;
(async () => {
    model = await loadInsectIdentifier();
})();

export const classify = async (path: string):Promise<string[]> => {
    const classes = await model.classifyInsect(path);
    
    const sorted = Object.entries(classes.confidences)
        .sort((a, b) => a[1] < b[1]? 1:-1)
        .map(val => val[0]);
    
    // console.log(sorted);
    return sorted;
}