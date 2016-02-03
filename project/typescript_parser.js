var ts = require("typescript"),
	fs = require("fs"),
	path = require("path"),
	filewalker = require("filewalker"),

	inputDir = "input_typescript",
	outFile = "out/typescript_out.txt",
	classDecoratorName = "myClassDecorator"

function cleanOutFile(filePath) {
	fs.truncateSync(filePath, 0);
	console.log("+cleared out file: " + filePath);
}
cleanOutFile(outFile);

var traverseFilesDir = function(filesDir) {
	if(!fs.existsSync(filesDir)) {
		throw "The input dir: " + filesDir + " does not exist!";
	}

	var allTsFiles = [];
	filewalker(filesDir)
		.on("file", function (file, info) {
			if(file.substring(file.length - 3, file.length) === '.ts') {
				var currentFileName = path.join(filesDir, file);
				allTsFiles.push(currentFileName);
				parseSingleFile(currentFileName)
					.then(traverseSourceFile)
					.then(writeToFile)
					.catch(exceptionHandler);
			}
		})
		.on('error', function(err) {
			reject(err);
		})
		.walk();
}

traverseFilesDir(inputDir);

var parseSingleFile = function(currentFile) {
	return new Promise(function (resolve, reject) {
		var fileContent = fs.readFileSync(currentFile).toString();
		var sourceFile = ts.createSourceFile("a.ts", fileContent, ts.ScriptTarget.ES6, /*setParentNodes */ false);
		resolve(sourceFile);
	});
}

var traverseSourceFile = function(data, err) {
	return new Promise(function (resolve, reject) {
			var foundClassDecorator = false;
			function fill(node) {

				if (node.kind === ts.SyntaxKind.Decorator) {
					if(node.expression && node.expression.expression) {
						if(node.expression.arguments.length === 0) {
							throw "There are no arguments in the decorator"
						}
						if(node.expression.expression.text === classDecoratorName) {
							resolve(node.expression.arguments[0].text);
						}
						else {
							throw "There is no '" + classDecoratorName + "' decorator in the file"
						}
					}
				}
				ts.forEachChild(node, fill);
			}
			fill(data);

			if(!foundClassDecorator) {
				throw "Didn't find class decorator: '" + classDecoratorName + "'. Example: '@myClassDecorator(\"a.b.C\")'"
			}
	})
}

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
		console.log("data: " + data)
		fs.appendFile(outFile, data + '\n', function (writeFileError) {
			if(err) {
				return reject(err);
			}
			if(writeFileError) {				
				return reject(writeFileError);
			}

			return resolve(data);
		});
	});
}

var exceptionHandler = function (reason) {
	console.log("Error: Exception Handler Caught: " + reason);
}