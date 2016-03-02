Parser.js :
- Warn when constant is not used
- Warn when deprecated attribute is used
- Warn when attribute is not supported in current tag
- Warn when using some deprecated or non standard tags
- Some tags such as "applet" are not matched, matching instead "a".
- Lines inside code block should not be parsed
    @amel:(
        Do not parse this
    )
- Authorize inclusion of other amel documents
    @include:(
        variables.amel
    )
- Run js code
    @code:(
        var str = ""; // exported to @str
        var _prefix = "link"; // private var
        for ( var i = 0 ; i < 10 ; i++ ) {
            str += "span.link#link" + i + "(" + _prefix + i + ")";
        }
    )

    navbar (
        @str
    )