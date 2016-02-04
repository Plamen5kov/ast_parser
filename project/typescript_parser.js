var ts = require("typescript"),
	fs = require("fs"),
	path = require("path"),
	filewalker = require("filewalker"),
	stringify = require("./helpers/json_extension"),


	inputDir = "input_typescript",
	outFile = "out/typescript_out.txt",
	classDecoratorName = "JavaProxy"

function cleanOutFile(filePath) {
	fs.truncateSync(filePath, 0);
	console.log("+cleared out file: " + filePath);
}

function createFile(filePath) {
	if(ensureDirectories(outFile)) {
		fs.writeFileSync(outFile, "");
		console.log("+created ast output file: " + outFile);
	}
	cleanOutFile(filePath)
}

function ensureDirectories(filePath) {
	var parentDir = path.dirname(filePath);
	if(fs.existsSync(parentDir)) {
		return true;
	}

	ensureDirectories(parentDir);
	fs.mkdirSync(parentDir);
	return true;
}

createFile(outFile)


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
		var sourceFile = ts.createSourceFile("a.ts", fileContent, ts.ScriptTarget.ES5, /*setParentNodes */ true);
		resolve(sourceFile);
	});
}

var traverseSourceFile = function(data, err) {
	return new Promise(function (resolve, reject) {
			var foundClassDecorator = false,
				classNameFromDecorator = "no decorator name found";
				extendedClassNameArr = [],
				classDeclarationCount = 0;

			function fill(node) {
				// resolve(stringify(node))

				// get custom class decorator
				if (node.kind === ts.SyntaxKind.Decorator) {
					if(node.expression && node.expression.expression) {
						if(node.expression.arguments.length === 0) {
							throw "There are no arguments in the decorator"
						}
						if(node.expression.expression.text === classDecoratorName) {
							foundClassDecorator = true;
							var tempName = node.expression.arguments[0].text;
							var isCorrectClassName = /^(((\w+\.)+\w+)|(\w+))$/.test(tempName);
							if(!isCorrectClassName) {
								throw "The argument '" + tempName + "' of the '" + classDecoratorName + "' decorator is not following the right pattern which is: '[namespace.]ClassName'. Example: 'a.b.ClassName'";
							}
							classNameFromDecorator = tempName;
							// resolve(classNameFromDecorator);

						}
						else {
							throw "There is no '" + classDecoratorName + "' decorator in the file"
						}
					}
				}

				if(node.kind === ts.SyntaxKind.ClassDeclaration) {
					classDeclarationCount ++;
					if(classDeclarationCount > 1) {
						throw "There is more than one class declaration in one file!" //TODO: specify file!
					}
					if(node.heritageClauses && node.heritageClauses[0] && node.heritageClauses[0].types && node.heritageClauses[0].types[0]) {
						var currentNode = node.heritageClauses[0].types[0];

						while(true) {
							if(currentNode && currentNode.text) {
								extendedClassNameArr.push(currentNode.text)
								break;
							}

							if(currentNode && currentNode.expression && currentNode.expression.name) {
								var currentProp = currentNode.expression.name.text;
								extendedClassNameArr.push(currentProp)
							}
							
							currentNode = currentNode.expression;
						}
					}
				}

				ts.forEachChild(node, fill);
			}
			fill(data);

			if(!foundClassDecorator) {
				throw "Did not find class decorator: '" + classDecoratorName + "'. Example: '@" + classDecoratorName + "(\"a.b.C\")'"
			}

			var decoratorClassArgument = classNameFromDecorator;
			var extendedClassNames = extendedClassNameArr.reverse().join(".");
			var extendedMethodNames = "not yet";
			var lineToWrite = "Java File: " + decoratorClassArgument + " - Extend Class: " + extendedClassNames + " - Overridden Methods: " + extendedMethodNames;
			console.log(lineToWrite)
			// resolve(lineToWrite);
	})
}

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
		// console.log("data: " + data)
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