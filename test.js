#!/usr/bin/env node

var Fs         = require( "fs" );
var Path       = require( "path" );
var Parser     = require( "./modules/parser.js" );
var Crypto     = require( "crypto" );
var Logger     = require( "./modules/logger.js" );
var testTotal  = 0;
var testPassed = 0;
var logger     = new Logger();
var scriptName = __filename;
scriptName     = scriptName.replace( __dirname + "/", "" );

// Parse all test files and compare their md5 sum with the expected result MD5
Fs.readdir( "tests", function( err, items ) {
    if ( err ) {
        throw err
    }
    for ( var i = 0 ; i < items.length ; i++ ) {
        // Only parse .htbl files
        if ( Path.extname( items[i]) === ".htbl" ) {
            parser = new Parser();
            parser.parse( "./tests/" + items[i], compare );
        }
    }
//     logger.log( "--------------------\n" + testPassed + " / " + testTotal + " tests passed" );
});

var compare = function( item ) {
    testTotal++;
    var testName    = item.replace( ".htbl", "" );
    testName        = item.replace( "./tests/", "" );
    var resFile     = item.replace( "htbl", "res" );
    var htmlFile    = item.replace( "htbl", "html" );
    var resContent  = "";
    var htmlContent = "";
    // If res file does not exists
    try {
        Fs.accessSync( resFile, Fs.F_OK );
        resContent = Fs.readFileSync( resFile );
    } catch ( e ) {
        logger.log( testName + ": Res file ( " + resFile + " ) not accessible", scriptName, "e" );
//         process.exit( 1 );
    }
    // If html file was not generated
    try {
        Fs.accessSync( htmlFile, Fs.F_OK );
        htmlContent = Fs.readFileSync( htmlFile );
    } catch ( e ) {
        logger.log( testName + ": HTML file (" + htmlFile + ") not accessible", scriptName, "e" );
//         process.exit( 1 );
    }
    
    // Compute and compare MD5 sums of the generated HTML file and expected result
    var challengedMD5 = Crypto.createHash( "md5" ).update( htmlContent ).digest( "hex" );
    var resMD5        = Crypto.createHash( "md5" ).update( resContent ).digest( "hex" );
    // Print result
    if ( challengedMD5 === resMD5 ) {
        logger.log( "- " + testName + " [\x1b[32m√\x1b[0m]", scriptName );
        testPassed++;
    } else {
        logger.log( "- " + testName + " [\x1b[31mX\x1b[0m]", scriptName );
    }
}