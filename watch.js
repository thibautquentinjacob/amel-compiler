#!/usr/bin/env node

var Watcher = require( "./modules/watcher.js" );

// Files to watch are passed through command line
var files = [];
if ( process.argv.length >= 3 ) {
    for ( var i = 2 ; i < process.argv.length ; i++ ) {
        files.push( process.argv[i]);
    }
}

var watcher = new Watcher( files );