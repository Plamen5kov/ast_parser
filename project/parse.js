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
	es6_visitors = require("./visitors/es6-visitors"),
	es5_visitors = require("./visitors/es5-visitors"),
	t = require("babel-types"),
	filewalker = require('filewalker'), 

	appDir = path.dirname(require.main.filename),
	extendDecoratorName = "extendDecorator", // TODO: think about name
	outFile = "out/extended_classes.txt", //default out file
	inputFile = "app/test_es5-6_syntax.js",
	inputDir = "app"

if(process.env.AST_PARSER_OUT_FILE) {
	outFile = process.env.AST_PARSER_OUT_FILE.trim();
}

if(process.env.AST_PARSER_INPUT_DIR) {
	inputDir = process.env.AST_PARSER_INPUT_DIR.trim();
}

/////////////// init ////////////////
function cleanOutFile(filePath) {
	fs.truncateSync(filePath, 0);
	logger.info("+cleared out file: " + filePath);
}

function createFile(filePath) {
	if(ensureDirectories(outFile)) {
		fs.writeFileSync(outFile, "");
		logger.info("+created ast output file: " + path.join(appDir, outFile));
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

/////////////// execute ////////////////

var traverseFilesDir = function(filesDir) {
	if(!fs.existsSync(filesDir)) {
		throw "The input dir: " + filesDir + " does not exist!";
	}

	filewalker(filesDir)
		.on("file", function (file, info) {
			if(file.substring(file.length - 3, file.length) === '.js') {
				var currentFileName = path.join(filesDir, file);
				readFile(currentFileName)
					.then(astFromFileContent)
					.then(visitAst)
					.then(writeToFile)
					.catch(exceptionHandler)
			}
		})
		.on('error', function(err) {
			reject(err);
		})
		.walk();
}

traverseFilesDir(inputDir);

var readFile = function (filePath, err) {
	return new Promise(function (resolve, reject) {

		fs.readFile(filePath, function (err, data) {

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
					// logger: logger,
					extendDecoratorName: extendDecoratorName
				};

				es6_visitors.decoratorVisitor(path, decoratorConfig);
				es5_visitors.decoratorVisitor(path, decoratorConfig);
			}
		})

		try {
			logger.info("+trying to parse ES6 syntax!");
			var decoratorClassName = es6_visitors.decoratorVisitor.getDecoratorClassName();
			var extendedClassNames = es6_visitors.decoratorVisitor.getExtendClass();
			var extendedMethodNames = es6_visitors.decoratorVisitor.getMethodNames();
			var lineToWrite = "Java File: " + decoratorClassName + " - Extend Class: " + extendedClassNames + " - Overridden Methods: " + extendedMethodNames;
			es6_visitors.decoratorVisitor.clearData();
			logger.info("\nJava File: " + decoratorClassName + "\nExtend Class: " + extendedClassNames + "\nOverridden Methods: " + extendedMethodNames);
			return resolve(lineToWrite);
		}
		catch (e) {
			logger.info("Error: " + e);
			logger.info("+trying to parse ES5 syntax!");
			var decoratorClassName = es5_visitors.decoratorVisitor.getDecoratorClassName(); // my.custom.Class
			var extendedClassNames = es5_visitors.decoratorVisitor.getExtendClass(); // android.widget.Button
			var extendedMethodNames = es5_visitors.decoratorVisitor.getMethodNames();  // onClick,onClick1
			var lineToWrite = "Java File: " + decoratorClassName + " - Extend Class: " + extendedClassNames + " - Overridden Methods: " + extendedMethodNames;
			es5_visitors.decoratorVisitor.clearData();
			return resolve(lineToWrite);
			logger.info("\nJava File: " + decoratorClassName + "\nExtend Class: " + extendedClassNames + "\nOverridden Methods: " + extendedMethodNames);	
		}
		return resolve(data);
	});
}

var writeToFile = function(data, err) {

	return new Promise (function (resolve, reject) {

		fs.appendFile(outFile, data + '\n', function (writeFileError) {
			if(err) {
				logger.warn("Error from writeToFile: " + err);
				return reject(err);
			}
			if(writeFileError) {				
				logger.warn("Error writing file: " + writeFileError);
				return reject(writeFileError);
			}

			logger.info("+appended '" + data + "' to file: " + outFile);
			return resolve(data);
		});
	});
}

var exceptionHandler = function (reason) {
	logger.error("Error: Exception Handler Caught: " + reason);
}