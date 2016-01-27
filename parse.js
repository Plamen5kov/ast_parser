var disableLogger = false;
if(process.env.AST_PARSER_DISABLE_LOGGING.trim() === "true") {
	disableLogger = true;
}

loggingSettings = {
	"logDirectory" : "logs",
	"strategy" : "console",
	"APP_NAME" : "ast_parser",
	"disable": disableLogger
};
// loggingSettings.level = 'info';

var fs = require("fs"),
	babelParser = require("babylon"),
	logger = require('./helpers/logger')(loggingSettings),
	path = require("path"),
	appDir = path.dirname(require.main.filename);

var outFile = "out/ast.txt"; //default out file

if(process.env.AST_PARSER_OUT_FILE) {
	outFile = process.env.AST_PARSER_OUT_FILE.trim();
	if(ensureDirectories(outFile)) {
		fs.writeFileSync(outFile, "");
		logger.info("+created ast output file: " + path.join(appDir, outFile));
	}
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