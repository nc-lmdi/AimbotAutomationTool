function generateTestStep(data) {
    let role;
    let options;
    let locator = "";
    let getCall = "getByRole";
    let finalString;

    function evaluateString() {
        // CSS engine
        if (data.tag) {
            let cssContent;
            if (data.class != null || data.class != "") {
                cssContent = `.${data.pathString}`
            }
            else if (data.ariaLabel != null || data.ariaLabel != "") {
                cssContent = `[aria-label="${data.ariaLabel}"]`;
            }
            locator += `css=${cssContent}`
        }
æ
        // Text engine
        if (data.text.length > 0) {
            locator += `>> text=${data.text}`;
        }
    }

    evaluateString()


    finalString = 'a' //`await page.locator('${locator}').first().click();`;

    console.log(finalString);

    return finalString;
}

module.exports = generateTestStep;