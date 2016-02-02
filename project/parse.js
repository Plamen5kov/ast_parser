///////////////// config /////////////////

var disableLogger = false;
if(process.env.AST_PARSER_DISABLE_LOGGING && process.env.AST_PARSER_DISABLE_LOGGING.trim() === "true") {
	disableLogger = true;
}

loggingSettings = {
	"logDirectory" : "logs",
	"strategy" : "console",
	"APP_NAME" : "ast_parser",
	"disable": disableLogger
};

var fs = require("fs"),
	babelParser = require("babylon"),
	traverse = require("babel-traverse"),
	logger = require('./helpers/logger')(loggingSettings),
	path = require("path"),	
	stringify = require("./helpers/json_extension"),
	ns_visitors = require("./visitors/es6-visitors"),
	t = require("babel-types"),

	appDir = path.dirname(require.main.filename),
	extendDecoratorName = "extendDecorator", // TODO: think about name
	outFile = "out/ast.txt", //default out file
	inputFile = "app/test_es6_syntax.js";

if(process.argv[2] === "es5") {
	inputFile =  "app/test_es5_syntax.js";
}

if(process.env.AST_PARSER_OUT_FILE) {
	outFile = process.env.AST_PARSER_OUT_FILE.trim();
}

/////////////// init ////////////////

function createFile(filePath) {
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


/////////////// execute ////////////////

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
		var ast = babelParser.parse(data, {
						plugins: ["decorators"]
					});
		// var ast = babelParser.parse("var = 4"); //try if error handling works ok
		return resolve(ast);
	});
};

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
	 	// fs.writeFile(outFile, JSON.stringify(data, null, 4), function (writeFileError) {
	 	fs.writeFile(outFile, stringify(data), function (writeFileError) {

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

var visitAst = function (data, err) {
	return new Promise (function (resolve, reject) {
		if(err) {
			logger.warn("+DIDN'T visit ast!");
			return reject(err);
		}

		logger.info("+visiting ast with given visitor library!");

		traverse.default(data, {
			enter(path) {
				var decoratorConfig = {
					logger: logger,
					extendDecoratorName: extendDecoratorName
				};
				ns_visitors.decoratorVisitor(path, decoratorConfig);
			}
		})

		var decoratorClassName = ns_visitors.decoratorVisitor.getDecoratorClassName();
		var extendedMethodNames = ns_visitors.decoratorVisitor.getMethodNames();
		// console.log(decoratorClassName + " - " + extendedMethodNames);

		return resolve(data);
	});
}

var exceptionHandler = function (reason) {
	logger.error("Error: Exception Handler Caught: " + reason);
}

readFile(inputFile).then(astFromFileContent)
						.then(visitAst)
						.then(writeToFile)
						.catch(exceptionHandler)