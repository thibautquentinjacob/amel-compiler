Parser.js :
- Warn when constant is not used
- Warn when deprecated attribute is used
- Warn when attribute is not supported in current tag
- Warn when using some deprecated or non standard tags
√ Some tags such as "applet" are not matched, matching instead "a".
√ Lines inside code block should not be parsed
    @amel:(
        Do not parse this
    )
- In amel code blocks, replace '\n' by <br>
- Authorize inclusion of other amel documents
    @include:(
        variables.amel
    )
- Run JS or other language code. Implicitly use JS. Otherwise, if precised, use the language between brackets.
    @extern:(
        var str = ""; // exported to @str
        var _prefix = "link"; // private var
        for ( var i = 0 ; i < 10 ; i++ ) {
            str += "span.link#link" + i + "(" + _prefix + i + ")";
        }
    )

    navbar (
        @str
    )
√ Writing br for a line skip is ugly
√ Can't use tag names inside text
- If constant use, then can't format (bold, ...)
- Can't use parenthesis in js code for the moment
- Extern can't be put in Amel for now