var ts = require("typescript"),
	fs = require("fs"),
	path = require("path"),
	filewalker = require("filewalker"),

	inputDir = "input_typescript",
	outFile = "out/typescript_out.txt"

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
			}
		})
		.on('error', function(err) {
			reject(err);
		})
		.on("done", function () { 
			getProgram(inputDir, allTsFiles)
				.then(getAllClasses)
				.then(writeToFile)
				.catch(exceptionHandler);
		})
		.walk();
}

traverseFilesDir(inputDir);

var getProgram =  function (root, files) {
	return new Promise(function (resolve, reject) {
		try {
			var _program = buildLanguageService(root, files).getProgram();
			return resolve(_program);
		}
		catch(e) {
			return reject(e);
		}
	}) ;
}

var buildLanguageService = function (root, allFiles) {

	var options = {
		module: ts.ModuleKind.CommonJS 
	};

	var serviceHost = {
		getScriptFileNames: function() {
			return allFiles;
		}, 
		getScriptVersion: function(fileName) {
			return "1"
		},
		getScriptSnapshot: function (filePath) {
			if (!fs.existsSync(filePath)) {
				throw "File :'" + filePath + "' does not exist!" ;
			}
			var fileContent = fs.readFileSync(filePath).toString();
			return ts.ScriptSnapshot.fromString(fileContent);
		},
		getCompilationSettings: function() { 
			return options
		},
		getCurrentDirectory: function() {
			return root
		},
		getDefaultLibFileName: function(options) {
			return ts.getDefaultLibFilePath(options)
		}
	};

	return ts.createLanguageService(serviceHost, ts.createDocumentRegistry());
}

var getAllClasses = function (program, err) {
	return new Promise(function (resolve, reject) {
		var allClasses= [];

		program.getSourceFiles().forEach(function callBack(tsSource) {
			var fill = function (node) {

				if (node.kind === ts.SyntaxKind.Decorator) {
					console.log(node.end);
					// return resolve(node.end);
				}
				ts.forEachChild(node, fill);
			}
			fill(tsSource);
		});

		// return resolve(allClasses);
	})
}

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {

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