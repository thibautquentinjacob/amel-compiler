### What is Amel?

### Installation

Depending on how you want to use it for. At the moment, ``amel-compiler`` can be used either as a standalone compiler or as a npm module inside a project.

#### Standalone

For a standalone compilation utility, you just have to clone the repo, and use run.js : 
```shell
$ cd path/to/compiler
$ node run.js file.amel 
```

This will ouput a ``file.html``

You can alias it or export it to your PATH variable if you want to use it globaly as a system command.

#### As npm module inside another project

To use as a runtime dynamic compiler, you may use ``amel-compiler`` as a npm module inside you nodejs app. For now the module is not registered on npmjs.com, so you will have to copy it directly in the ``node_modules/`` directory of your project which imply to package it with your app if you want to distribute it (or to avoid echo-ing ``node_modules`` to your ``.gitignore``). 

To install it as an npm module with the dedicated npm command line util, open a shell (UNIX):

```shell 
$ cd path/to/compiler
$ npm install --prefix /path/to/your/project amel-compiler
```

This will install ``amel-compiler`` in a ``node_modules/``directory of your project (it maybe easier to prefix an absolute path). 

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
		res.send(compiled.output);
	});
});
```

TODO: Runtime client parsing
