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
    var inAmelCode            = 0;
    var inExtern              = 0;
    var externCodeBuffer      = "";
    var logger                = new Logger();
    var keywords              = new Keywords();
    var lineNumber            = 0;
    verbose                   = 3;
    profiling                 = true;
    writeToFile               = true;
    logger.setUseFile( true );
    logger.setFilePath( "./log.txt" );

    // Regular expressions
    var multilineComment      = /\/\*(.*)\*\//;
    var multilineCommentSRe   = /\/\*(.*)/;
    var multilineCommentERe   = /(.*)\*\/\s*$/;
    var commentRe             = /^\s*\/\//;
    var ConstDefRe            = /@([a-zA-Z0-9_]+)\s*=\s*"(.*)"/;
    var constUseRe            = /@([a-zA-Z0-9_]+)/;
    var elementDeclarationRe  = /^\s*([^\.#][^ @\(\)\[\]]*)\s*(\[.*\])?\s*\(/;
    var elementDeclaration2Re = /^\s*([^\.#][^ @\)\[\]]*)(\[.*\])/; // elements without values
    var implicitDeclarationRe = /^\s*(\.[^ @\(\)\[\]]+|#[^ @\(\)\[\]]+)\s*(\[.*\])?\s*\(/;
    var oneLineDeclarationRe  = /([^\.#> ][^ @\(\)\[\]>]*)\s*(\[[^\(\)>]*\])?\s*\(([^\)]+)\)/g;
    var elementClassRe        = /\.([a-zA-Z0-9_\-]+)/g;
    var elementIdRe           = /#([a-zA-Z0-9_\-]+)/;
    var elementAttributesRe   = /([a-zA-Z_\-]+)\s*=\s*"([^,"]*)"/g;
    var attributesConstRe     = /([a-z]+)\s*=\s*@([a-zA-Z0-9_]+)/g;
    var newLineRe             = /\\\\/g;
    var boldRe                = /__([^_]*)__/g;
    var italicRe              = /_([^_]*)_/g;
    var strokeRe              = /\-\-(.*)\-\-/g;
    var supRe                 = /\^\(\)/; // not used
    var blockEndRe            = /\)\s*$/;
    var tagRe                 = new RegExp( "(" + keywords.tags.join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var singletonTagRe        = new RegExp( "^[ \t]*(" + keywords.singletonTags.join( "|" ) + 
                                ")\s*(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var nonStandardTagRe      = new RegExp( "(" + keywords.nonStandardTags.join( "|" ) + 
                                ")\s*(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var deprecatedTagRe       = new RegExp( "(" + Object.keys( keywords.deprecatedTags ).join( "|" ) + 
                                ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?" );
    var amelCodeRe            = /@amel\s*:\s*\(/;
    var externRe              = /@extern\s*:\s*\(/;
    
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
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + 
                            ": Found one line multiline comment: " + res[1], 
                            scriptName );
            }
            output += indentation() + "<!--" + res[1] + "-->\n";
        // multiline comment end
        } else if ( res = multilineCommentERe.exec( line )) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Found multiline comment end", 
                            scriptName );
            }
            if ( res[1] !== "" ) {
                output += indentation() + "  " + res[1] + "-->\n";
            } else {
                output += indentation() + res[1] + "-->\n";
            }
            if ( !inMultilineComment ) {
                if ( verbose > 1 ) {
                    logger.log( "Line " + lineNumber + 
                                ": No open multiline comment was found", 
                                scriptName, "w" );
                }
            }
            inMultilineComment = 0;
        // Block end
        } else if ( blockEndRe.exec( line )) {
            levelIndex--;
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Closing block", scriptName );
            }
            // If standard code
            if ( !inAmelCode && !inExtern ) {
                var element = levels.pop();
                output += indentation() + "</" + element + ">\n";
                if ( inStyleMarkup && element === "style" ) {
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": No longer in style markup", 
                                    scriptName );
                    }
                    inStyleMarkup = 0;
                }
            // If in an external code
            } else if ( inExtern ) {
                if ( levels[levelIndex] === "extern" ) {
                    levels.pop();
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Evaluating code buffer:\n" + 
                                    externCodeBuffer, scriptName );
                    }
//                     output += eval( externCodeBuffer ) + "\n";
                    var out = eval( "function fun() { " + externCodeBuffer + "}; fun()" );
                    // export returned vars to environment
                    for ( var key in out ) {
                        logger.log( "Exporting constant " + key + " = " + out[key], 
                                    scriptName );
                        constants[key] = out[key];
                    }
                    inExtern = 0;
                } else {
                    output += line + "<br>\n";
                }
            // If in amel code block
            } else {
                if ( levels[levelIndex] === "amel" ) {
                    levels.pop();
                    output += indentation() + "</amel>\n";
                    inAmelCode = 0;
                } else {
                    output += line + "<br>\n";
                }
            }
        /* If inside multiline comment ignore anything except closing 
           multiline comment */
        } else if ( !inAmelCode && !inExtern && ( inMultilineComment || inStyleMarkup )) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Inside multiline comment", scriptName );
            }
            if ( inStyleMarkup ) {
                // Check for constant use within the style markup
                while ( constant = constUseRe.exec( line )) {
                    if ( constants[constant[1]]) {
                        if ( verbose === 3 ) {
                            logger.log( "Line " + lineNumber + ": Replacing @" + 
                                        constant[1] + " by " + constants[constant[1]], 
                                        scriptName );
                        }
                        var line = line.replace( "@" + constant[1], constants[constant[1]]);
                    } else {
                        if ( verbose > 0 ) {
                            logger.log( "Line " + lineNumber + ": Constant " + 
                                        constant[1] + " undefined", scriptName, "e" );
                        }
                        var line = line.replace( "@" + constant[1], "?" + constant[1] );
                    }
                }
                output += line + "\n";
            } else {
                output += indentation() + "  " + line + "\n";   
            }
        // multiline comment start
        } else if ( !inAmelCode && !inExtern && ( res = multilineCommentSRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + 
                            ": Found multiline comment start", scriptName );
            }
            if ( inMultilineComment && verbose > 1 ) {
                logger.log( "Line " + lineNumber + 
                            ": Already in a multiline comment", scriptName, "w" );
            }
            inMultilineComment = 1;
            output += indentation() + "<!--" + res[1] + "\n";
        // Skip line if one line comment
        } else if ( !inAmelCode && !inExtern && ( commentRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Comment " + line, scriptName );
            }
            output += indentation() + "<!--" + line.trim().replace( /^\/\//, "" ) + 
                      " -->\n";
        // Amel code block
        } else if ( res = amelCodeRe.exec( line )) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Found amel code block", 
                            scriptName );
            }
            output += indentation() + "<amel>\n";
            inAmelCode = 1;
            levelIndex++;
            levels.push( "amel" );
        // External code block
        } else if ( !inAmelCode && ( res = externRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Found extern code block", 
                            scriptName );
            }
            inExtern = 1;
            levelIndex++;
            levels.push( "extern" );
            externCodeBuffer = "";
        // Constant definition
        } else if ( !inAmelCode && !inExtern && ( res = ConstDefRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Const " + res[1] + " = " + 
                            res[2], scriptName );
            }
            // Send warning if constant is being redefined
            if ( constants[res[1]] && verbose > 1 ) {
                logger.log( "Line " + lineNumber + ": redefining constant " + 
                            res[1] + " to " + res[2], scriptName, "w" );
            }
            constants[res[1]] = res[2];
        // Implicit declaration
        } else if ( !inAmelCode && !inExtern && ( res = implicitDeclarationRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Implicit declaration: " + 
                            res[1], scriptName );
            }
            if ( inAmelCode ) {
                levelIndex++;
                output += line + "<br>\n";
            } else {
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
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Attribute: " + 
                                    attributes[1] + " = " + attributes[2], scriptName );
                    }
                    element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                    checkAttribute( attributes[1], "div" );
                }
                element += ">";
                output += element + "\n";
                levelIndex++;
                levels.push( tag );
            }
        // Element declaration
        } else if ( !inExtern && ( res = elementDeclarationRe.exec( line ))) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Element: " + res[1] + 
                            ", level index " + levelIndex + " at " + res[0].trim(), 
                            scriptName );
            }
            if ( inAmelCode ) {
                levelIndex++;
                output += line + "<br>\n";
            } else {
                var baseElement        = tagRe.exec( res[1]);
                var singletonElement   = singletonTagRe.exec( res[1]);
                var nonStandardElement = nonStandardTagRe.exec( res[1]);
                var deprecatedElement  = deprecatedTagRe.exec( res[1]);
                var tag                = "";
                if ( singletonElement && verbose > 0 ) {
                    logger.log( "Line " + lineNumber + ": " + singletonElement[1] + 
                                " is a singleton element", scriptName, "e" );
                }
                if ( !baseElement ) {
                    if ( nonStandardElement ) {
                        tag = nonStandardElement[1];
                        if ( verbose > 1 ) {
                            logger.log( "Line " + lineNumber + 
                                        ": This element may not be supported in all browsers", 
                                        "w" );
                        }
                    } else if ( deprecatedElement ) {
                         tag = deprecatedElement[1];
                         if ( verbose > 1 ) {
                             logger.log( "Line " + lineNumber + ": " + tag + 
                                         " element is deprecated.", scriptName, "w" );
                        }
                    } else {
                        if ( verbose > 0 ) {
                            logger.log( "Line " + lineNumber + 
                                        ": Invalid element at line: " + line, scriptName, 
                                        "e" );
                        }
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
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Attribute: " + 
                                    attributes[1] + " = " + attributes[2], scriptName );
                    }
                    element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                    checkAttribute( attributes[1], tag );
                }
                // Search for constant use in attributes
                while ( attributes = attributesConstRe.exec( res[2])) {
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Const in attribute: " + 
                                    attributes[1] + " = " + attributes[2], scriptName );
                    }
                    if ( constants[attributes[2]]) {
                        if ( verbose === 3 ) {
                            logger.log( "Line " + lineNumber + ": Replacing @" + 
                                        attributes[2] + " by " + constants[attributes[2]], 
                                        scriptName );
                        }
                        attributes[2] = attributes[2].replace( attributes[2], 
                                                               constants[attributes[2]]);
                    } else {
                        if ( verbose > 0 ) {
                            logger.log( "Line " + lineNumber + ": Constant " + 
                                        attributes[2] + " undefined", scriptName, "e" );
                        }
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
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Skipping inside style markup", 
                                    scriptName );
                    }
                    inStyleMarkup = 1;
                }
            }
        // Singleton element declaration
        } else if ( res = elementDeclaration2Re.exec( line )) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Singleton tag", scriptName );
            }
            if ( inAmelCode ) {
                levelIndex++;
                output += line + "<br>\n";
            } else {
                var baseElement        = tagRe.exec( res[1]);
                var singletonElement   = singletonTagRe.exec( res[1]);
                var nonStandardElement = nonStandardTagRe.exec( res[1]);
                var deprecatedElement  = deprecatedTagRe.exec( res[1]);
                var tag                = "";
                if ( !singletonElement && verbose > 0 ) {
                    logger.log( "Line " + lineNumber + ": " + res[1] + 
                                " is not a singleton element", scriptName, "e" );
                } else {
                    tag = res[1];
                }
            
                if ( verbose === 3 ) {
                    logger.log( "Line " + lineNumber + ": Element: " + res[1] + 
                                ", level index " + levelIndex + " at " + res[0].trim(), 
                                scriptName );
                }
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
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Attribute: " + attributes[1] + 
                                    " = " + attributes[2], scriptName );
                    }
                    element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                    checkAttribute( attributes[1], tag );
                }
                // Check for constant use in attributes
                while ( attributes = attributesConstRe.exec( res[2])) {
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Const in attribute: " + 
                                    attributes[1] + " = " + attributes[2], scriptName );
                    }
                    if ( constants[attributes[2]]) {
                        if ( verbose === 3 ) {
                            logger.log( "Line " + lineNumber + ": Replacing @" + 
                                        attributes[2] + " by " + constants[attributes[2]], 
                                        scriptName );
                        }
                        attributes[2] = attributes[2].replace( attributes[2], 
                                                               constants[attributes[2]]);
                    } else {
                        if ( verbose > 0 ) {
                            logger.log( "Line " + lineNumber + ": Constant " + 
                                        attributes[2] + " undefined", scriptName, "e" );
                        }
                        attributes[2] = attributes[2].replace( attributes[2], 
                                                               "?" + attributes[2] );
                    }
                    element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                }
                output += element + " />\n";
            }
        // Constant used
        } else if ( line.match( constUseRe )) {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Constant used", scriptName );
            }
            while ( !inAmelCode && ( constant = constUseRe.exec( line ))) {
                if ( constants[constant[1]]) {
                    if ( verbose === 3 ) {
                        logger.log( "Line " + lineNumber + ": Replacing @" + 
                                    constant[1] + " by " + constants[constant[1]], 
                                    scriptName );
                    }
                    var line = line.replace( "@" + constant[1], constants[constant[1]]);
                } else {
                    if ( verbose > 0 ) {
                        logger.log( "Line " + lineNumber + ": Constant " + 
                                    constant[1] + " undefined", scriptName, "e" );
                    }
                    var line = line.replace( "@" + constant[1], "?" + constant[1] );
                }
            }
            output += line + "<br>\n";
        // Everything else
        } else {
            if ( verbose === 3 ) {
                logger.log( "Line " + lineNumber + ": Other", scriptName );
            }
            if ( singletonElement = singletonTagRe.exec( line )) {
                if ( verbose === 3 ) {
                    logger.log( "Line " + lineNumber + ": Found " + 
                                singletonElement[1], scriptName );
                }
                output += indentation() + "<" + singletonElement[1] + "><br>\n";
            } else {
                if ( !inExtern && !inAmelCode ) {
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
                        if ( verbose === 3 ) {
                            logger.log( "Line " + lineNumber + ": Element: " + elements[0] + 
                                        ", level index " + levelIndex + " at " + elements[0].trim(), 
                                        scriptName );
                        }
                        var baseElement        = tagRe.exec( elements[1]);
                        var singletonElement   = singletonTagRe.exec( elements[1]);
                        var nonStandardElement = nonStandardTagRe.exec( elements[1]);
                        var deprecatedElement  = deprecatedTagRe.exec( elements[1]);
                        var tag                = "";
                        if ( singletonElement && verbose > 0 ) {
                            logger.log( "Line " + lineNumber + ": " + singletonElement[1] + 
                                        " is a singleton element", scriptName, "e" );
                        }
                        if ( !baseElement ) {
                            if ( nonStandardElement ) {
                                tag = nonStandardElement[1];
                                if ( verbose > 1 ) {
                                    logger.log( "Line " + lineNumber + 
                                                ": This element may not be supported in all browsers", 
                                                "w" );
                                }
                            } else if ( deprecatedElement ) {
                                 tag = deprecatedElement[1];
                                 if ( verbose > 1 ) {
                                     logger.log( "Line " + lineNumber + ": " + tag + 
                                                 " element is deprecated.", scriptName, "w" );
                                }
                            } else {
                                if ( verbose > 0 ) {
                                    logger.log( "Line " + lineNumber + 
                                                ": Invalid element at line: " + line, scriptName, 
                                                "e" );
                                }
                                return;
                            }
                        } else { tag = baseElement[1] }
                        var element = "<" + tag;
                        // Find classes
                        if ( line.match( elementClassRe )) {
                            var classAmount = 0;
                            element += " class=\"";
                            while ( classes = elementClassRe.exec( elements[1])) {
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
                            if ( verbose === 3 ) {
                                logger.log( "Line " + lineNumber + ": Attribute: " + 
                                            attributes[1] + " = " + attributes[2], scriptName );
                            }
                            element += " " + attributes[1] + "=\"" + attributes[2] + "\"";
                            checkAttribute( attributes[1], tag );
                        }
                        element += ">" + elements[3] + "</" + tag + ">";
                        line = line.replace( elements[0], element );
                    }
                }
                if ( !inExtern ) {
                    output += indentation() + line.trim() + "<br>\n";                    
                } else {
                    externCodeBuffer += line.trim() + "\n";
                }
            }
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
            if ( verbose > 0 ) {
                logger.log( e, scriptName, "e" );
            }
            process.exit( 1 );
        }
        var outputFile = file.replace( ".amel", ".html" );
        var output = "";
        if ( verbose === 3 ) {
            logger.log( "Parsing file: " + file, scriptName );
        }
        // Read file line by line
        var timeParseStart = Date.now();
        this.lineReader    = require( 'readline' ).createInterface({
            input: require( 'fs' ).createReadStream( file )
        });
        this.lineReader.on( 'line', function ( line ) {
            output += parseLine( line );
        });
        
        this.lineReader.on( 'close', function() {
            // Should we measure time spent to parse?
            if ( profiling ) {
                var timeParseEnd = Date.now();
                logger.log( "Parsing took " + ( timeParseEnd - timeParseStart ) + 
                            " ms", scriptName );
            }
            // Write generated output to file
            if ( writeToFile ) {
                Fs.writeFileSync( outputFile, output );
                // Should we measure the time spent to write the output?
                if ( profiling ) {
                    var timeWroteOutput = Date.now();
                    logger.log( "Writing output took " + 
                                ( timeWroteOutput - timeParseEnd ) + " ms", scriptName );
                }
            }            
            callback( file );
            return output;
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
     * Sets parser verbose level.
     * @param int level between 0 (nothing), 1 (errors), 2 (errors + warnings), 
     * 3 (everything)
     * @return Nothing
     */
    Parser.prototype.setVerbose = function( level ) {
        var invalidLevel = false;
        var newLevel     = 0;
        if ( level < 0 ) {
            invalidLevel = true;
        } else if ( level > 3 ) {
            newLevel     = 3;
            invalidLevel = true;
        }
        
        if ( invalidLevel && verbose > 0 ) {
            logger.log( "Invalid verbose level " + level + 
                        ". Level should be 0-3. Setting to " + newLevel + 
                        " instead.", scriptName, "e" );
        }
        verbose = level;
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
    
    /**
     * Checks attribute with a specific tag
     *
     * First check if attribute exists. If it's the case, check if the supplied
     * tag qualifies for this specific attribute. Print warnings accordingly.
     * Do the same to check if attribute is deprecated with input tag.
     * @param Attribute
     * @param HTML tag
     * @return Nothing
     */
    var checkAttribute = function( attribute, tag ) {
        // If attribute exists
        if ( keywords.attributes[attribute]) {
            // Check if it applies to input tag
            var supportedTags = keywords.attributes[attribute];
            // If only specific tags are supported
            if ( supportedTags[0] !== "global" ) {
                var foundTag = false;
                for ( var i = 0 ; i < supportedTags.length ; i++ ) {
                    if ( supportedTags[i] === tag ) {
                        foundTag = true;
                        break;
                    }
                }
                // If tag is not supported, print warning
                if ( !foundTag && verbose > 1 ) {
                    logger.log( "Tag " + tag + " does not accept attribute " + 
                                attribute, scriptName, "w" );
                }
            }
            // Check if attribute is deprecated for that tag
            if ( keywords.deprecatedAttributes[attribute]) {
                var deprecated = keywords.deprecatedAttributes[attribute];
                var foundTag = false;
                for ( var i = 0 ; i < deprecated.length ; i++ ) {
                    if ( deprecated[i] === tag ) {
                        foundTag = true;
                        break;
                    }
                }
                if ( foundTag && verbose > 1 ) {
                    logger.log( "Attribute " + attribute + " is deprecated for tag " + 
                                tag, scriptName, "w" );
                }
            }
        // Otherwise print warning
        } else if ( verbose > 1 ) {
            logger.log( "Attribute " + attribute + " does not exist", 
                        scriptName, "w" );
        }
    }
};

module.exports = Parser;
