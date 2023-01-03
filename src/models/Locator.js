class Locator {
    role;
    options;
    testString;

    constructor(elementId, elementText, elementClass, elementTag, role, options, testString) {
        this.elementId = elementId;
        this.elementText = elementText;
        this.elementClass = elementClass;
        this.elementTag = elementTag;
        this.role = "combobox";
        this.options = "name: 'Acceptér alle'";
        this.testString = testString;
    };
}


module.exports = Locator;