//IMPORTANT: Init with amel keywords (to avoid cross ref)
function AmelRe(keywords) {
    this.multilineComment = /\/\*(.*)\*\//;
    this.multilineCommentSRe = /\/\*(.*)/;
    this.multilineCommentERe = /(.*)\*\/\s*$/;
    this.commentRe = /^\s*\/\//;
    this.ConstDefRe = /@([a-zA-Z0-9_]+)\s*=\s*"(.*)"/;
    this.constUseRe = /@([a-zA-Z0-9_]+)/;
    this.elementDeclarationRe = /^\s*([^\.#][^ @\(\)\[\]]*)(\[.*\])?\(/;
    this.elementDeclaration2Re = /^\s*([^\.#][^ @\)\[\]]*)(\[.*\])/;
    this.implicitDeclarationRe = /^\s*(\.[^ @\(\)\[\]]+|#[^ @\(\)\[\]]+)(\[.*\])?\(/;
    this.oneLineDeclarationRe = /([^\.#> ][^ @\(\)\[\]>]*)(\[[^\(\)>]*\])?\(([^\)]+)\)/g;
    this.elementClassRe = /\.([a-zA-Z0-9_\-]+)/g;
    this.elementIdRe = /#([a-zA-Z0-9_\-]+)/;
    this.elementAttributesRe = /([a-zA-Z_\-]+)\s*=\s*"([^,"]*)"/g;
    this.attributesConstRe = /([a-z]+)\s*=\s*@([a-zA-Z0-9_]+)/g;
    this.newLineRe = /\\\\/g;
    this.boldRe = /__([^_]*)__/g;
    this.italicRe = /_([^_]*)_/g;
    this.strokeRe = /\-\-(.*)\-\-/g;
    this.supRe = /\^\(\)/; // not used
    this.blockEndRe = /\)\s*$/;
    this.tagRe = new RegExp("(" + keywords.tags.join("|") +
        ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?");
    this.singletonTagRe = new RegExp("^[ \t]*(" + keywords.singletonTags.join("|") +
        ")\s*(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?");
    this.nonStandardTagRe = new RegExp("(" + keywords.nonStandardTags.join("|") +
        ")\s*(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?");
    this.deprecatedTagRe = new RegExp("(" + Object.keys(keywords.deprecatedTags).join("|") +
        ")(?:#[a-zA-Z0-9_]+)?(?:.[a-zA-Z0-9_]+)*(?:#[a-zA-Z0-9_]+)?");
    this.amelCodeRe = /@amel:\(/;
    this.externRe = /@extern:\(/;  
}

module.exports = AmelRe;