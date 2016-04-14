var p = require('./modules/parser.js');
var amel = new p();

var text = require('fs').readFileSync('./example/site.amel', 'utf-8');
amel.parse(text, function(obj){
    console.log(obj.output);
});