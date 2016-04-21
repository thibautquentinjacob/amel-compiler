#!/usr/bin/env node

var Parser = require( "./modules/parser.js" );
var parser = new Parser( true );
if ( process.argv.length > 2 ) {
    parser.parse( process.argv[2], function() {
        
    });
} else {
    console.log( "node run.js file.amel" );
}