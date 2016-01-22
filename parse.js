loggingSettings = {
	"logDirectory" : "logs",
	"strategy" : "console",
	"APP_NAME" : "ast_parser",
	"disable": false // TODO: take from environment variable
};
// loggingSettings.level = 'info';

var fs = require("fs"),
	babelParser = require("babylon"),
	logger = require('./helpers/logger')(loggingSettings);

// TODO: get from environment variable and leave this as default
var outFile = "out/ast.txt";

var readFile = function (currentFilePath) {
	return new Promise(function (resolve, reject) {

		fs.readFile(currentFilePath, function (err, data) {

			if(err) {
				logger.warn("+DIDN'T get content of file!");
				return reject(err);
			}

			logger.info("+got content of file!");
			return resolve(data.toString());	
		});
	});
}

var astFromFileContent = function (data, err) {
	return new Promise(function (resolve, reject) {

		if(err) {
			logger.warn("+DIDN'T parse ast from file!");
			return reject(err);
		}
		
		logger.info("+parsing ast from file!");
		var ast = babelParser.parse(data);
		// var ast = babelParser.parse("var = 4"); //try if error handling works ok
		return resolve(ast);
	});
};

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
	 	fs.writeFile(outFile, JSON.stringify(data, null, 4), function (writeFileError) {

			if(err) {
				logger.warn("Error from writeToFile: " + err);
				return reject(err);
			}
			if(writeFileError) {				
				logger.warn("Error writing file: " + writeFileError);
				return reject(writeFileError);
			}

			logger.info("+wrote to file: " + outFile);
			return resolve(data);
		});
	});
}

// TODO: implement and require from another file
var visitorsPackage = {
	"decoratorVisitor": function decoratorVisitor() {},
	"extendVisitor": function extendVisitor() {},
	"classVisitor": function classVisitor() {}
}

var visitAst = function (data, err) {
	return new Promise (function (resolve, reject) {
		if(err) {
			logger.warn("+DIDN'T visit ast!");
			return reject(err);
		}

		logger.info("+visiting ast with given visitor library!");

		// TODO: return visitor result and write to file
		var visitResult = visitWith(data, visitorsPackage);
		return resolve(visitResult);
	});
}

var visitWith = function(ast, visitorsForEs5) {
	logger.info("+visiting happens here");
}

var exceptionHandler = function (reason) {
	logger.error("Error: Exception Handler Caught: " + reason);
}

readFile("app/test.js").then(astFromFileContent)
						.then(writeToFile) //fluent api for debugging purposes
						.then(visitAst)
						.catch(exceptionHandler)