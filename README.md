### What is Amel?

### Installation

### Running

### Cheat sheet

##### Markup declaration
A markup can be declared

##### Comments
Single line comments

Multiple line comments

##### Constant definition

### Using as npm module [experimental]

You can choose to use ``amel-compiler`` as an inner npm module. By doing this, you can use amel as the coding language for your webpages directly. By doing so it is possible to use amel-compiler with express router.

While using as a npm module, you have to require it and instanciate it:

```javascript
var Compiler = require('amel-compiler');
var amel = new Compiler.Amel();
//Then use as standard stuff with express for example
...
//Assuming express is declared as app
app.get("/about", function(req, res){
	res.send(amel.parse("__dirname/path/to/file.amel"));
});
//Or using an optionnal callback
app.get("/about", function(req, res){
	amel.parse("__dirname/path/to/file.amel", function(compiled){
		res.send(compiled);
	});
});
```

TODO: Runtime client parsing
