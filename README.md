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
	amel.parse("__dirname/path/to/file.amel", function(compiled){
		res.send(compiled.output);
	});
});
```

### Going the client way

While running tests.js, the client amel-compiler is written into the ```dist/```directory. You can embed it into a web page to use it from the client side :
```html 
<html>
<head>
	<script src="path/to/client-amel-compiler.js"></script>
	[...]
	<script>
		function init(){
			var p = new Parser();
			var b = document.getElementById("compile");
			b.addEventListener("click", function(){
				var inp = document.getElementById('in');
				var out = document.getElementById('out');
				p.clientSideParse(inp.value, function(o){
					out.innerHTML=o;
				});
			});
		}
	</script>
</head>
	<body onload="init()">
  
		<textarea id = "in" style="height:90%;width:50%;max-height:90%;max-width:50%;position:absolute; top:0;left:0;margin:0;"></textarea>
		<div id="out" style="height:90%;width:50%;position:absolute; top:0;right:0;margin:0;border:1px solid black;"></div>
		<button id="compile" style="position:absolute;top:92%;left:5%">Compile</button>
	</body>
</html>
```

Here we are using a button to trigger the compilation. We request two divs to work, one textarea or any content editable raw text element, and out two append the generated html DOM. You may use whatever system to trigger compilation: it can be a button, an event listener on text input, or a ``` MutationObserver``` (even if this method is a bit tricky though).

Warning: <p style="color: red">As it is required on a server side parser, you have to provide a callback to the ```clientSideParse``` method! Don't forget that javascript is an asynchronous event-driven language</p>

