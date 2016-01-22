loggingSettings = {
	"logDirectory" : "logs",
	"strategy" : "console",
	"APP_NAME" : "ast_parser",
	"disable": false //TODO: take from environment variable
};
// loggingSettings.level = 'info';

var fs = require("fs"),
	babelParser = require("babylon"),
	logger = require('./helpers/logger')(loggingSettings);

//TODO: get from environment variable and leave this as default
var outFile = "out/ast.txt";

var readFile = function (currentFilePath) {
	return new Promise(function (resolve, reject) {

		fs.readFile(currentFilePath, function (err, data) {

			if(err) {
				logger.error("+DIDN'T get content of file!");
				logger.error(err);
				reject(err);
			}

			logger.info("+got content of file!");
			resolve(data.toString());			
		});
	});
}

var astFromFileContent = function (data, err) {
	return new Promise(function (resolve, reject) {

		if(err) {
			logger.error("+DIDN'T parse ast from file!");
			reject(err);
		}
		
		logger.info("+parsing ast from file!");
		var ast = babelParser.parse(data);
		// var ast = babelParser.parse("var = 4"); //try if error handling works ok
		resolve(ast);
	});
};

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
	 	fs.writeFile(outFile, JSON.stringify(data, null, 4), function (writeFileError) {

			if(err) {
				logger.error("Error from writeToFile: " + err);
				reject(err);
			}
			if(writeFileError) {				
				logger.error("Error writing file: " + writeFileError);
				reject(writeFileError);
			}

			logger.info("+wrote to file: " + outFile);
			resolve(data);
		});
	});
}

//TODO: implement and require from another file
var visitorsPackage = {
	"decoratorVisitor": function decoratorVisitor() {},
	"extendVisitor": function extendVisitor() {},
	"classVisitor": function classVisitor() {}
}

var visitAst = function (data, err) {
	return new Promise (function (resolve, reject) {
		if(err) {
			logger.error("+DIDN'T visit ast!");
			reject(err);
		}

		logger.info("+visiting ast with given visitor library!");
		visitWith(data, visitorsPackage);
	});
}

var visitWith = function(ast, visitorsForEs5) {
	logger.info("+visiting happens here");
}

var exceptionHandler = function (reason) {
	logger.info("Error: Exception Handler Caught: " + reason);
}

readFile("app/test.js").then(astFromFileContent)
						.then(writeToFile) //fluent api for debugging purposes
						.then(visitAst)
						.catch(exceptionHandler)