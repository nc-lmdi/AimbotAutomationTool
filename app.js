const TestStep = require("./src/models/TestStep.js");
const Test = require("./src/models/Test.js");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs").promises;
var cors = require('cors')
const { exec } = require('child_process');
const sqlite3 = require('sqlite3');

// Full scope variables
let currentlyActiveTest;
let currentTestResult;
let lineFail
let testSteps = [];
let locator;
let allTests;

// View engine config
app.set("view engine", "ejs");

// Setup SQLite DB
let db = new sqlite3.Database('Tests.db')
db.run("CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY, test_name TEXT NOT NULL)");
db.run("CREATE TABLE IF NOT EXISTS test_step (id INTEGER PRIMARY KEY, action TEXT NOT NULL, value TEXT NOT NULL, screenshot TEXT NOT NULL, step_order INTEGER NOT NULL, test_id INTEGER NOT NULL);");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "5mb" }));
const jsonParser = bodyParser.json();

// CORS options
var corsOptions = {
  origin: "http://example.com",
  methods: ['GET', 'PUT', 'POST'],
  optionsSuccessStatus: 200,
}

// Get method for Index
app.get("/", async function (req, res) {
  let allTests = await getAllSavedTests();
  res.render("index", { allTestSteps: currentlyActiveTest?.testSteps, allSavedTests: allTests, testResult: currentTestResult, failedStep: lineFail });
})

// Post method for Index
app.post("/", function (req, res) {
})

// Post method for creating object
app.post("/createTestStep", cors(), function (req, res) {
  generateTestStep(action = req.body.actions, value = req.body.value, screenshot = req.body.screenshot);
  res.redirect(req.get('referer'));
})

// Post method for Create test
app.post("/runTest", async function (req, res) {
  lineFail = undefined;
  currentTestResult = undefined;
  testTitle = "tests/playwrightTest.spec.js";

  // Create the actual test file
  async function createFile() {
    await fs.writeFile(
      testTitle,
      /* ***
      * Writing the test body *
      *** */
      'const { test, expect } = require("@playwright/test");const playwright = require("playwright");\n' + /* Main imports for the test */
      '\ntest("Main playwright test", async ({ page }) => {\n' + /* Async function, don't have to change at all */
      generateTestStepsString() + /* The golden function - converting objects to strings */
      "});",

      // Check if function threw error
      function (err) {
        if (err) throw err;
        console.log("Saved!");
      }
    );
  }

  // Run test function - now runs as a child process of nodeJs, the 'exec' function handles the process - fetch return values from that functions callback
  async function runTest() {
    await createFile();
    exec('npx playwright test', (err, stdout, stderr) => {
      if (err) {
        console.log("TEST FAILED");
        currentTestResult = false;
        getTestStepsResults();
        res.redirect("/")
        console.error(`exec error: ${err}`);
      } else {
        console.log("TEST PASSED");
        currentTestResult = true;
        res.redirect("/")
      }
      console.log(stdout);
    });
  }

  // Generate the actual test string that PlayWright will execute
  function generateTestStepsString() {
    waitTime = 1000
    testStepsString = "";

    currentlyActiveTest.testSteps.forEach(step => {
      switch (step.Action) {
        case 'goToSite':
          if (step.Value.includes("http") || step.Value.includes("https")) {
            testStepsString += "\nawait page.goto('" + step.Value + "');await page.waitForLoadState(); await page.waitForTimeout(" + waitTime + ");\n"
          }
          else {
            let stringWithHttp = "https://" + step.Value;
            testStepsString += "\nawait page.goto('" + stringWithHttp + "');await page.waitForLoadState(); await page.waitForTimeout(" + waitTime + ");\n"
          }
          break;
        case 'selectElement':
          testStepsString += step.Value + " await page.waitForTimeout(" + waitTime + ");\n";
          break;
        case 'enterText':
          testStepsString += "await page.keyboard.press('Control+A');\nawait page.keyboard.type('" + step.Value + "'); await page.waitForTimeout(" + waitTime + ");\n"
          break;
        case 'copyText':
          testStepsString += "await page.keyboard.press('Control+A');\nawait page.keyboard.press('Control+C'); await page.waitForTimeout(" + waitTime + ");\n";
          break;
        case 'pasteText':
          testStepsString += "await page.keyboard.press('Control+A');\nawait page.keyboard.press('Control+V'); await page.waitForTimeout(" + waitTime + ");\n";
          break;
        case 'addPause':
          testStepsString += "await page.waitForTimeout(" + step.Value + ");\n"
          break;
        default:
          break;
      }
    });
    return testStepsString;
  }
  runTest();
})

// Delete specific test step
app.post("/deleteStep", function (req, res) {
  currentlyActiveTest.testSteps.splice(req.body.id, 1)
  res.redirect("/")
})

// Reset the entire test
app.get("/resetTest", function (req, res) {
  currentTestResult = undefined;
  currentlyActiveTest.testSteps = []
  res.redirect("/")
})

// Save test
app.post("/saveTest", function (req, res) {
  currentTestResult = undefined;
  db.run(`INSERT INTO tests (test_name) VALUES ('${req.body.testName}')`)
  db.get(`SELECT id FROM tests WHERE test_name = '${req.body.testName}'`, function (err, row) {
    if (err) {
      console.log(err)
    }
    else {
      currentlyActiveTest.testSteps.forEach(step => {
        console.log(step.Value)
        db.run(`INSERT INTO test_step (action, value, screenshot, test_id, step_order) VALUES (\"${step.Action}\", \"${step.Value}\", \"${step.Screenshot}\", \"${row.id}\", "${step.Order}")`)
      });
    }
  })
  res.redirect("/")
})

// Load test
app.post("/loadTest", function (req, res) {
  currentTestResult = undefined;

  // First clear the test
  if (currentlyActiveTest) {
    currentlyActiveTest.testSteps = []
  }

  // Fetch all test steps that match the id of the test selected in the front end
  db.all(`SELECT * FROM test_step WHERE test_id=${req.body.loadTest} ORDER BY step_order ASC;`, function (err, rows) {
    if (err) {
      console.error(err)
    }
    else {
      // For each test step selected, generate a new test step in the front end
      rows.forEach(step => {
        generateTestStep(action = step.action, value = step.value, screenshot = step.screenshot);
      });
    }
  })
  res.redirect("/")
})

// Main listener for the server - runs on port 3000
app.listen(3000, function () {
  console.log("Server has started on port 3000");
})


/* *** FUNCTIONS *** */

function generateTestStep(action, value, screenshot) {
  var stepOrder;
  // Check if active test already exists, if yes, add test step, if not create new test
  if (currentlyActiveTest) {
    stepOrder = currentlyActiveTest.testSteps.length + 1;
    let newAction = new TestStep(action = action, value = value, screenshot = screenshot, order = stepOrder);
    currentlyActiveTest.testSteps.push(newAction);
  }
  else {
    stepOrder = 1;
    let newAction = new TestStep(action = action, value = value, screenshot = screenshot, order = stepOrder);
    currentlyActiveTest = new Test()
    currentlyActiveTest.testSteps.push(newAction);
  }
}

function getAllSavedTests() {
  return new Promise((resolve, reject) => {
    testsObj = {}
    db.all(`SELECT id, test_name FROM tests`, function (err, rows) {
      if (err) {
        console.log(err)
        reject(err);
      }
      else {
        rows.forEach(row => {
          let id = row.id;
          let testName = row.test_name
          testsObj[`${id}`] = `${testName}`
        });
        resolve(testsObj);
      }
    })
  })
}

async function getTestStepsResults() {
  var testReport = require('./results.json')
  lineFail = testReport.suites[0].specs[0].tests[0].results[0].errors[0].location.line - 4;
}






