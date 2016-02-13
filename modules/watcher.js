/**
 * Watcher class
 * 
 * Watch a set of amel files and recompile them when a modification is done
 * @param An array of amel files
 * @return None
 */

var Fs         = require( "fs" );
var Exec       = require( "child_process" ).exec;
var Logger     = require( "./logger.js" );
var Parser     = require( "./parser.js" );
var scriptName = __filename;
scriptName     = scriptName.replace( __dirname + "/", "" );

function Watcher ( files ) {
    var watchedFiles = [];
    var logger       = new Logger();
    var pollInterval = 100;
    // Check if all the files exist and are readable
    for ( var i = 0 ; i < files.length ; i++ ) {
        try {
            Fs.accessSync( files[i], Fs.R_OK | Fs.F_OK );
            logger.log( "Adding " + files[i] + " to watch list", scriptName );
            var stats = Fs.statSync( files[i]);
            watchedFiles.push({ "name": files[i], "time": stats.mtime });
            var parser           = new Parser();
            parser.logToScreen( true );
            parser.parse( watchedFiles[i].name, function() {
                logger.log( "Finished compiling", scriptName );
            });
        } catch ( e ) {
            logger.log( "File " + files[i] + " is not accessible: " + e, 
                            scriptName, "e" );
        }
    }
    logger.log( "Added " + watchedFiles.length + " files", scriptName );
    
    Watcher.prototype.watch = function( file ) {
        try {
            Fs.accessSync( file, Fs.F_OK );
            logger.log( "Adding " + file + " to watch list" );
        } catch ( e ) {
            logger.log( e, scriptName, "e" );
        }
    };
    
    Watcher.prototype.unwatch = function( index ) {
        if ( index > watchedFiles.length - 1 || index < 0 ) {
            logger.log( "No such index: " + index, scriptName, "w" );
        } else {
            watchedFiles.splice( index, 1 );
        }
    };
    
    Watcher.prototype.listWatched = function() {
        for ( var i = 0 ; i < watchedFiles.length ; i++ ) {
            logger.log( i + ": " + watchedFiles[i]);
        }
    }
    
    Watcher.prototype.check = function() {
        for ( var i = 0 ; i < watchedFiles.length ; i++ ) {
            try {
                Fs.accessSync( watchedFiles[i].name, Fs.R_OK | Fs.F_OK );
                // Check the file last modification Date
                var stats = Fs.statSync( watchedFiles[i].name );
                if ( stats.mtime > watchedFiles[i].time ) {
                    logger.log( "Refreshing " + watchedFiles[i].name, scriptName );
                    watchedFiles[i].time = stats.mtime;
                    var parser           = new Parser();
                    parser.logToScreen( true );
                    parser.parse( watchedFiles[i].name, function( file ) {
                        logger.log( "Finished compiling", scriptName );
                        file = file.replace( "amel", "html" );
//                         Exec( "open " + file );
                    });
                }
            } catch ( e ) {
                logger.log( "File " + watchedFiles[i].name + 
                            " is no longer accessible: " + e, 
                            scriptName, "e" );
            }
        }
    }
    
    var interval = setInterval( this.check, pollInterval );

};

module.exports = Watcher;