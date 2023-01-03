const TestStep = require("./TestStep.js");

class Test {

    constructor(title, testSteps = []) {
        this.title = title;
        this.testSteps = testSteps;
    };
}


module.exports = Test;