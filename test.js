#!/usr/bin/env node

// Requirements
var Fs = require("fs");
var Path = require("path");
var Crypto = require("crypto");
var Parser = require("./modules/parser.js");
var Logger = require("./modules/logger.js");
var testTotal = 0;
var testPassed = 0;
var logger = new Logger();
var scriptName = __filename;
scriptName = scriptName.replace(__dirname + "/", "");

// For each files in the test folder, parse it and run compare callback on EOF.
Fs.readdir("tests", function (err, items) {
    if (err) {
        throw err
    }
    for (var i = 0; i < items.length; i++) {
        // Only parse .amel files
        if (Path.extname(items[i]) === ".amel") {
            parser = new Parser();
            parser.parse("./tests/" + items[i], compare);
        }
    }
    //     logger.log( "--------------------\n" + testPassed + " / " + testTotal + " tests passed" );
});

/**
 * Checks if the produce of the amel file compilation gave the expected output.
 * 
 * Provided an input amel file, check if a res and an html file with the same
 * root name exist. Print an error if not. If both exist, compare the MD5 sum of
 * the res (expected) file to the HTML (output) file. Print the result.
 * @param Input file
 * @return None
 */
var compare = function (_item) {
    var item = _item.path;
    testTotal++;
    var testName = item.replace(".amel", "");
    testName = item.replace("./tests/", "");
    var resFile = item.replace(".amel", ".res");
    var htmlFile = item.replace(".amel", ".html");
    var resContent = "";
    var htmlContent = "";
    // If res file does not exists
    try {
        Fs.accessSync(resFile, Fs.F_OK);
        resContent = Fs.readFileSync(resFile);
    } catch (e) {
        logger.log(testName + ": Res file ( " + resFile +
            " ) not accessible", scriptName, "e");
    }
    // If html file was not generated
    try {
        Fs.accessSync(htmlFile, Fs.F_OK);
        htmlContent = Fs.readFileSync(htmlFile);
    } catch (e) {
        logger.log(testName + ": HTML file (" + htmlFile +
            ") not accessible", scriptName, "e");
    }

    // Compute and compare MD5 sums of the generated HTML file and expected result
    var challengedMD5 = Crypto.createHash("md5")
        .update(htmlContent)
        .digest("hex");
    var resMD5 = Crypto.createHash("md5")
        .update(resContent)
        .digest("hex");
    // Print result
    if (challengedMD5 === resMD5) {
        logger.log("- " + testName + " [\x1b[32m√\x1b[0m]", scriptName);
        testPassed++;
    } else {
        logger.log("- " + testName + " [\x1b[31mX\x1b[0m]", scriptName);
    }
}
