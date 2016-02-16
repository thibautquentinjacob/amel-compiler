/**
 * Parser class
 * 
 * Parses file in Amel language.
 * @param Nothing
 * @return Nothing
 */

// Requirements
var Keywords   = require( "./keywords.js" );
var Logger     = require( "./logger.js" );
var Fs         = require( "fs" );
var scriptName = __filename;
scriptName     = scriptName.replace( __dirname + "/", "" );

function Parser () {
    // Attributes
    var constants             = {};
    var levels                = [];
    var levelIndex            = 0;
    var inMultilineComment    = 0;
    var inStyleMarkup         = 0;
    var logger                = new Logger();
    var keywords              = new Keywords();
    var lineNumber            = 0;
    logger.setUseFile( true );
    logger.setFilePath( "./log.txt" );

    // Regular expressions
    var multilineComment      = /\/\*(.*)\*\//;
    var multilineCommentSRe   = /\/\*(.*)/;
    var multilineCommentERe   = /(.*)\*\/\s*$/;
    var commentRe             = /^\s*\/\//;
    var ConstDefRe            = /@([a-zA-Z0-9_]+)\s*=\s*"(.*)"/;
    var constUseRe            = /@([a-zA-Z0-9_]+)/g;
    var elementDeclarationRe  = /^\s*([^\.#][^ @\(\)\[\]]+)\s*(\[.*\])?\s*\(/;
    var elementDeclaration2Re = /^\s*([^\.#][^ @\)\[\]]+)(\[.*\])/; // elements without values
    var implicitDeclarationRe = /^\s*(\.[^ @\(\)\[\]]+|#[^ @\(\)\[\]]+)\s*(\[.*\])?\s*\(/;
    var oneLineDeclarationRe  = /([^\.#> ][^ @\(\)\[\]>]+)\s*(\[[^\(\)>]*\])?\s*\(([^\)]+)\)/g;
    var elementClassRe        = /\.([a-zA-Z0-9_\-]+)/g;
    var elementIdRe           = /#([a-zA-Z0-9_\-]+)/;
    var elementAttributesRe   = /([a-z]+)\s*=\s*"([^,"]*)"/g;
    var attributesConstRe     = /([a-z]+)\s*=\s*@([a-zA-Z0-9_]+)/g;

    var newLineRe             = /\\\\/g;
    var boldRe                = /__([^_]*)__/g;
    var italicRe              = /_([^_]*)_/g;
    var strokeRe              = /\-\-(.*)\-\-/g;
    var supRe                 = /\^\(\)/
    var blockEndRe            = /\)\s*$/;
    var tagRe                 = new RegExp( "(" + keywords.tags.join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var singletonTagRe        = new RegExp( "(" + keywords.singletonTags.join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var nonStandardTagRe      = new RegExp( "(" + keywords.nonStandardTags.join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var deprecatedTagRe       = new RegExp( "(" + Object.keys( keywords.deprecatedTags ).join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    
    /**
     * Parses input line by trying to match regular expressions. Depending on
     * cases, output is generated and returned when matching is complete.
     * @param Line to parse
     * @return String output
     */
    var parseLine = function( line ) {
        lineNumber++;
        var output = "";
        // One line multiline comment. Why, but why?
        if ( res = multilineComment.exec( line )) {
            logger.log( "Line " + lineNumber + 
                        ": Found one line multiline comment: " + res[1], 
                        scriptName );
            output += indentation() + "<!--" + res[1] + "-->\n";
        // multiline comment end
        } 
        else if ( res = multilineCommentERe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Found multiline comment end", 
                        scriptName );
            if ( res[1] !== "" ) {
                output += indentation() + "  " + res[1] + "-->\n";
            } else {
                output += indentation() + res[1] + "-->\n";
            }
            if ( !inMultilineComment ) {
                logger.log( "Line " + lineNumber + 
                            ": No open multiline comment was found", 
                            scriptName, "w" );
            }
            inMultilineComment = 0;
        // Block end
        } 
        else if ( blockEndRe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Closing block", scriptName );
            levelIndex--;
            var element = levels.pop();
            output += indentation() + "</" + element + ">\n";
            if ( inStyleMarkup && element === "style" ) {
                logger.log( "Line " + lineNumber + ": No longer in style markup", 
                            scriptName );
                inStyleMarkup = 0;
            }
        /* If inside multiline comment ignore anything except closing 
           multiline comment */
        } 
        else if ( inMultilineComment || inStyleMarkup ) {
            if ( inStyleMarkup ) {
                // Check for constant use within the style markup
                while ( constant = constUseRe.exec( line )) {
                    if ( constants[constant[1]]) {
                        logger.log( "Line " + lineNumber + ": Replacing @" + 
                                    constant[1] + " by " + constants[constant[1]], 
                                    scriptName );
                        var line = line.replace( "@" + constant[1], constants[constant[1]]);
                    } else {
                        logger.log( "Line " + lineNumber + ": Constant " + 
                                    constant[1] + " undefined", scriptName, "e" );
                        var line = line.replace( "@" + constant[1], "?" + constant[1] );
                    }
                }
                output += line + "\n";
            } else {
                output += indentation() + "  " + line + "\n";   
            }
        // multiline comment start
        } 
        else if ( res = multilineCommentSRe.exec( line )) {
            logger.log( "Line " + lineNumber + 
                        ": Found multiline comment start", scriptName );
            if ( inMultilineComment ) {
                logger.log( "Line " + lineNumber + 
                            ": Already in a multiline comment", scriptName, "w" );
            }
            inMultilineComment = 1;
            output += indentation() + "<!--" + res[1] + "\n";
        // Skip line if one line comment
        } 
        else if ( commentRe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Comment " + line, scriptName );
            output += indentation() + "<!--" + line.trim().replace( /^\/\//, "" ) + 
                      " -->\n";
        // Constant definition
        } 
        else if ( res = ConstDefRe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Const " + res[1] + " = " + 
                        res[2], scriptName );
            // Send warning if constant is being redefined
            if ( constants[res[1]]) {
                logger.log( "Line " + lineNumber + ": redefining constant " + 
                            res[1] + " to " + res[2], scriptName, "w" );
            }
            constants[res[1]] = res[2];
        // Implicit declaration
        } else if ( res = implicitDeclarationRe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Implicit declaration: " + 
                        res[1], scriptName );
            var tag = "div";
            // Indentation level
            var element = indentation() + "<" + tag;
            // Find classes
            if ( line.match( elementClassRe )) {
                var classAmount = 0;
                element += " class=\"";
                while ( classes = elementClassRe.exec( res[1])) {
                    if ( classAmount === 0 ) {
                        element += classes[1];
                    } else {
                        element += " " + classes[1];
                    }
                    classAmount++;
                }
                element += "\"";
            }
            // Find ids
            if ( line.match( elementIdRe )) {
                if ( id = elementIdRe.exec( res[1])) {
                    element += " id=\"" + id[1] + "\"";
                }
            }
            // Find attributes
            while ( attributes = elementAttributesRe.exec( res[2])) {
                logger.log( "Line " + lineNumber + ": Attribute: " + 
                            attributes[1] + " = " + attributes[2], scriptName );
                element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
            }
            element += ">";
            output += element + "\n";
            levelIndex++;
            levels.push( tag );
        // Element declaration
        } else if ( res = elementDeclarationRe.exec( line )) {
            logger.log( "Line " + lineNumber + ": Element: " + res[1] + 
                        ", level index " + levelIndex + " at " + res[0].trim(), 
                        scriptName );
            var baseElement        = tagRe.exec( res[1]);
            var singletonElement   = singletonTagRe.exec( res[1]);
            var nonStandardElement = nonStandardTagRe.exec( res[1]);
            var deprecatedElement  = deprecatedTagRe.exec( res[1]);
            var tag                = "";
            if ( singletonElement ) {
                logger.log( "Line " + lineNumber + ": " + singletonElement[1] + 
                            " is a singleton element", scriptName, "e" );
            }
            if ( !baseElement ) {
                if ( nonStandardElement ) {
                    tag = nonStandardElement[1]
                    logger.log( "Line " + lineNumber + 
                                ": This element may not be supported in all browsers", 
                                "w" );
                } else if ( deprecatedElement ) {
                     tag = deprecatedElement[1];
                     logger.log( "Line " + lineNumber + ": " + tag + 
                                 " element is deprecated.", scriptName, "w" );
                } else {
                    logger.log( "Line " + lineNumber + 
                                ": Invalid element at line: " + line, scriptName, 
                                "e" );
                    return;
                }
            } else { tag = baseElement[1] }
            // Indentation level
            var element = indentation() + "<" + tag;
            // Find classes
            if ( line.match( elementClassRe )) {
                var classAmount = 0;
                element += " class=\"";
                while ( classes = elementClassRe.exec( res[1])) {
                    if ( classAmount === 0 ) {
                        element += classes[1];
                    } else {
                        element += " " + classes[1];
                    }
                    classAmount++;
                }
                element += "\"";
            }
            // Find ids
            if ( line.match( elementIdRe )) {
                if ( id = elementIdRe.exec( res[1])) {
                    element += " id=\"" + id[1] + "\"";
                }
            }
            // Find attributes
            while ( attributes = elementAttributesRe.exec( res[2])) {
                logger.log( "Line " + lineNumber + ": Attribute: " + 
                            attributes[1] + " = " + attributes[2], scriptName );
                element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
            }
            while ( attributes = attributesConstRe.exec( res[2])) {
                logger.log( "Line " + lineNumber + ": Const in attribute: " + 
                            attributes[1] + " = " + attributes[2], scriptName );
                if ( constants[attributes[2]]) {
                    logger.log( "Line " + lineNumber + ": Replacing @" + 
                                attributes[2] + " by " + constants[attributes[2]], 
                                scriptName );
                    attributes[2] = attributes[2].replace( attributes[2], 
                                                           constants[attributes[2]]);
                } else {
                    logger.log( "Line " + lineNumber + ": Constant " + 
                                attributes[2] + " undefined", scriptName, "e" );
                    attributes[2] = attributes[2].replace( attributes[2], 
                                                           "?" + attributes[2] );
                }
                element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
            }
            element += ">";
            output += element + "\n";
            levelIndex++;
            levels.push( tag );
            if ( tag === "style" ) {
                logger.log( "Line " + lineNumber + ": Skipping inside style markup", 
                            scriptName );
                inStyleMarkup = 1;
            }
        // Singleton element declaration
        } else if ( res = elementDeclaration2Re.exec( line )) {
            var baseElement        = tagRe.exec( res[1]);
            var singletonElement   = singletonTagRe.exec( res[1]);
            var nonStandardElement = nonStandardTagRe.exec( res[1]);
            var deprecatedElement  = deprecatedTagRe.exec( res[1]);
            var tag                = "";
            if ( !singletonElement ) {
                logger.log( "Line " + lineNumber + ": " + res[1] + 
                            " is not a singleton element", scriptName, "e" );
            } else {
                tag = res[1];
            }
            
            logger.log( "Line " + lineNumber + ": Element: " + res[1] + 
                        ", level index " + levelIndex + " at " + res[0].trim(), 
                        scriptName );
            var element = indentation() + "<" + tag;
            // Find classes
            if ( res[1].match( elementClassRe )) {
                var classAmount = 0;
                element += " class=\"";
                while ( classes = elementClassRe.exec( res[1])) {
                    if ( classAmount === 0 ) {
                        element += classes[1];
                    } else {
                        element += " " + classes[1];
                    }
                    classAmount++;
                }
                element += "\"";
            }
            // Find ids
            if ( line.match( elementIdRe )) {
                if ( id = elementIdRe.exec( res[1])) {
                    element += " id=\"" + id[1] + "\"";
                }
            }
            // Find attributes
            while ( attributes = elementAttributesRe.exec( res[2])) {
                logger.log( "Line " + lineNumber + ": Attribute: " + attributes[1] + 
                            " = " + attributes[2], scriptName );
                element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
            }
            while ( attributes = attributesConstRe.exec( res[2])) {
                logger.log( "Line " + lineNumber + ": Const in attribute: " + 
                            attributes[1] + " = " + attributes[2], scriptName );
                if ( constants[attributes[2]]) {
                    logger.log( "Line " + lineNumber + ": Replacing @" + 
                                attributes[2] + " by " + constants[attributes[2]], 
                                scriptName );
                    attributes[2] = attributes[2].replace( attributes[2], 
                                                           constants[attributes[2]]);
                } else {
                    logger.log( "Line " + lineNumber + ": Constant " + 
                                attributes[2] + " undefined", scriptName, "e" );
                    attributes[2] = attributes[2].replace( attributes[2], 
                                                           "?" + attributes[2] );
                }
                element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
            }
            output += element + " />\n";
        // Constant used
        } else if ( line.match( constUseRe )) {
            while ( constant = constUseRe.exec( line )) {
                if ( constants[constant[1]]) {
                    logger.log( "Line " + lineNumber + ": Replacing @" + 
                                constant[1] + " by " + constants[constant[1]], 
                                scriptName );
                    var line = line.replace( "@" + constant[1], constants[constant[1]]);
                } else {
                    logger.log( "Line " + lineNumber + ": Constant " + 
                                constant[1] + " undefined", scriptName, "e" );
                    var line = line.replace( "@" + constant[1], "?" + constant[1] );
                }
            }
            output += line + "\n";
        // Everything else
        } else {
            logger.log( "Line " + lineNumber + ": Other", scriptName );
            // Indent text correctly
            // Bold text
            while ( bold = boldRe.exec( line )) {
                line = line.replace( "__" + bold[1] + "__", "<strong>" + 
                                     bold[1] + "</strong>" );
            }
            // Italic text
            while ( italic = italicRe.exec( line )) {
                line = line.replace( "_" + italic[1] + "_", "<em>" + 
                                     italic[1] + "</em>" );
            }
            // Stroke text
            while ( stroke = strokeRe.exec( line )) {
                line = line.replace( "--" + stroke[1] + "--", "<s>" + 
                                     stroke[1] + "</s>" );
            }
            // One line element declaration
            while ( elements = oneLineDeclarationRe.exec( line )) {
                logger.log( "Line " + lineNumber + ": Element: " + elements[0] + 
                            ", level index " + levelIndex + " at " + elements[0].trim(), 
                            scriptName );
                var baseElement        = tagRe.exec( elements[1]);
                var singletonElement   = singletonTagRe.exec( elements[1]);
                var nonStandardElement = nonStandardTagRe.exec( elements[1]);
                var deprecatedElement  = deprecatedTagRe.exec( elements[1]);
                var tag                = "";
                if ( singletonElement ) {
                    logger.log( "Line " + lineNumber + ": " + singletonElement[1] + 
                                " is a singleton element", scriptName, "e" );
                }
                if ( !baseElement ) {
                    if ( nonStandardElement ) {
                        tag = nonStandardElement[1]
                        logger.log( "Line " + lineNumber + 
                                    ": This element may not be supported in all browsers", 
                                    "w" );
                    } else if ( deprecatedElement ) {
                         tag = deprecatedElement[1];
                         logger.log( "Line " + lineNumber + ": " + tag + 
                                     " element is deprecated.", scriptName, "w" );
                    } else {
                        logger.log( "Line " + lineNumber + 
                                    ": Invalid element at line: " + line, scriptName, 
                                    "e" );
                        return;
                    }
                } else { tag = baseElement[1] }
                var element = "<" + tag;
                // Find classes
                if ( line.match( elementClassRe )) {
                    var classAmount = 0;
                    element += " class=\"";
                    while ( classes = elementClassRe.exec( res[1])) {
                        if ( classAmount === 0 ) {
                            element += classes[1];
                        } else {
                            element += " " + classes[1];
                        }
                        classAmount++;
                    }
                    element += "\"";
                }
                // Find ids
                if ( line.match( elementIdRe )) {
                    if ( id = elementIdRe.exec( element[1])) {
                        element += " id=\"" + id[1] + "\"";
                    }
                }
                // Find attributes
                while ( attributes = elementAttributesRe.exec( elements[2])) {
                    logger.log( "Line " + lineNumber + ": Attribute: " + 
                                attributes[1] + " = " + attributes[2], scriptName );
                    element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                }
                element += ">" + elements[3] + "</" + tag + ">";
                line = line.replace( elements[0], element );
            }
            output += indentation() + line.trim() + "\n";
        }
        return output;
    };

    /**
     * Check that input file is accessible. If it is, read it line by line,
     * calling parseLine function on them. Calls callback on EOF.
     * @param Input file path to amel file
     * @param callback to run on EOF
     * @return Nothing
     */
    Parser.prototype.parse = function ( file, callback ) {
        try {
            Fs.accessSync( file, Fs.F_OK );
        } catch ( e ) {
            logger.log( e, scriptName, "e" );
            process.exit( 1 );
        }
        var outputFile = file.replace( ".amel", ".html" );
        var output = "";
        logger.log( "Parsing file: " + file, scriptName );
        // Read file line by line
        this.lineReader = require( 'readline' ).createInterface({
            input: require( 'fs' ).createReadStream( file )
        });
        this.lineReader.on( 'line', function ( line ) {
            output += parseLine( line );
        });
        
        this.lineReader.on( 'close', function() {
            // Write generated output to file
            Fs.writeFileSync( outputFile, output );
            callback( file );
        });
    };
    
    /**
     * Sets wether or not to log the output of the parser to screen.
     * @param boolean state
     * @return Nothing
     */
    Parser.prototype.logToScreen = function( state ) {
        logger.setUseFile( !state );
    }
    
    /**
     * Returns the current indentation according to the current block depth.
     * @param Nothing
     * @return String containing spaces
     */
    var indentation = function() {
        var indentation = "";
        for ( var i = 0 ; i < levelIndex ; i++ ) {
            indentation += "    ";
        }
        return indentation;
    }
};

module.exports = Parser;