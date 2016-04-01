/***
 * Logger class
 * Provides timestamp to logs and possibility to log to file
 *
 * TODO: 
 * - Fix hard-coded path to log file in fs.access and fs.appendFile
 */
var fs = require( "fs" );
var colors = {
    "reset":      "\x1b[0m",
    "bright":     "\x1b[1m",
    "dim":        "\x1b[2m",
    "underscore": "\x1b[4m",
    "blink":      "\x1b[5m",
    "reverse":    "\x1b[7m",
    "hidden":     "\x1b[8m",
    "black":      "\x1b[30m",
    "red":        "\x1b[31m",
    "green":      "\x1b[32m",
    "yellow":     "\x1b[33m",
    "blue":       "\x1b[34m",
    "magenta":    "\x1b[35m",
    "cyan":       "\x1b[36m" };

function Logger() {
    this.useFile      = false;
    this.useTimestamp = false;
    
    // Getter & setters
    Logger.prototype.getUseFile = function() {
        return this.useFile;
    }
    
    Logger.prototype.getFilePath = function() {
        return this.filePath;
    }
    
    Logger.prototype.getUseTimestamp = function() {
        return this.useTimestamp;
    }
    
    // Set wether we should log to file or not
    Logger.prototype.setUseFile = function( bool ) {
        this.useFile = bool;
    }
    
    // Set file path
    Logger.prototype.setFilePath = function( path ) {
        this.filePath = path;
    }
    
    // Set wether we should use timestamp
    Logger.prototype.setUseTimestamp = function( bool ) {
        this.useTimestamp = bool;
    }
    
    /***
     * log
     * Log input message to console or to file
     * @input Message to print, the object sending the message, the error code
     * 'w' for warning or 'e' for error.
     * @ouput None
     */
    Logger.prototype.log = function( message, dispatcher, errorCode ) {
        // If we have an error code
        if ( !this.useFile ) {
            if ( errorCode === "w" ) { // warning code
                message = colors.yellow + message + colors.reset;
            } else if ( errorCode === "e" ) { // error_code
                message = colors.red + message + colors.reset;
            }
        } else {
            if ( errorCode === "w" ) { // warning code
                message = "WARNING: " + message;
            } else if ( errorCode === "e" ) { // error_code
                message = "ERROR: " + message;
            }
        }
        // If disptacher is defined
        if ( dispatcher !== "" && dispatcher !== undefined ) {
            if ( this.useFile ) {
                message = "[" + dispatcher + "] " + message;
            } else {
                message = "[" + colors.green + dispatcher + colors.reset + 
                          "] " + message;
            }
        }
        if ( this.useTimestamp ) {
            var date = new Date();
            if ( !this.useFile ) {
                message = colors.yellow + date.getDate() + 
                          "-" + date.getMonth() + "-" + 
                          date.getFullYear() + " " + date.getHours() + ":" + 
                          date.getMinutes() + ":" + date.getSeconds() + 
                          colors.red + " > " + colors.reset + message;
            } else {
                message = date.getDate() + "-" + date.getMonth() + "-" + 
                          date.getFullYear() + " " + date.getHours() + ":" + 
                          date.getMinutes() + ":" + date.getSeconds() + 
                          " > " + message;
            }
        }
        // Log to file
        if ( this.useFile ) {
            if ( this.filePath === "" || this.filePath === undefined ) {
                console.log( "No file to log to specified" );
                return;
            }
//             console.log( "logging '" + message + "' to " + this.filePath );
            fs.appendFileSync( this.filePath, message + "\n", "utf8" );
        // or on the console
        } else {
            console.log( message );
        }
    }
};

module.exports = Logger;