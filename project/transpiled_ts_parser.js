///////////////// config /////////////////

var disableLogger = true;
if(process.env.AST_PARSER_DISABLE_LOGGING && process.env.AST_PARSER_DISABLE_LOGGING.trim() === "true") {
	disableLogger = true;
}

loggingSettings = {
	"logDirectory" : require("path").dirname(require.main.filename) + "/logs",
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
	// es6_visitors = require("./visitors/es6-visitors"),
	es5_visitors = require("./visitors/es5-visitors"),
	t = require("babel-types"),
	filewalker = require('filewalker'),

	arguments = process.argv,
	appDir = path.dirname(require.main.filename),
	extendDecoratorName = "JavaProxy", // TODO: think about name
	outFile = "out/out_parsed_typescript.txt", //default out file
	inputDir = "input_parced_typescript";

//env variables
if(process.env.AST_PARSER_OUT_FILE) {
	outFile = process.env.AST_PARSER_OUT_FILE.trim();
}
if(process.env.AST_PARSER_INPUT_DIR) {
	inputDir = process.env.AST_PARSER_INPUT_DIR.trim();
}

//console variables have priority
if(arguments && arguments.length >= 3) {
	inputDir = arguments[2]
	console.log("inputDir: " + inputDir)
}
if(arguments && arguments.length >= 4) {
	outFile = arguments[3]
	console.log("outFile: " + outFile)
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
					// .then(writeToFile)
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
			var fileInfo = {
				filePath: filePath,
				data: data.toString()
			}
			return resolve(fileInfo);
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
		var ast = babelParser.parse(data.data, {
						plugins: ["decorators"]
					});
		data.ast = ast;
		return resolve(data);
	});
};

var visitAst = function (data, err) {
	return new Promise (function (resolve, reject) {
		if(err) {
			logger.warn("+DIDN'T visit ast!");
			return reject(err);
		}

		logger.info("+visiting ast with given visitor library!");

		traverse.default(data.ast, {
			enter(path) {

				var decoratorConfig = {
					logger: logger,
					extendDecoratorName: extendDecoratorName,
					filePath: data.filePath
				};
				es5_visitors.decoratorVisitor(path, decoratorConfig);				
			}
		})

		var linesToWrite = es5_visitors.decoratorVisitor.getExtendInfo().join("\n")
		return resolve(linesToWrite)
	});
}

var writeToFile = function(data, err) {

	return new Promise (function (resolve, reject) {

		fs.appendFile(outFile, data, function (writeFileError) {
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
	if(reason.errCode && reason.errCode === 1) {
		logger.error("(*)(*)(*)Error: Exception Handler Caught: " + reason.message);
		logger.error("PROCESS EXITING...");
		process.stderr.write(reason.message);
		process.exit(4);
	}
	else {
		logger.error("(*)(*)(*)Error: Exception Handler Caught: " + reason);
	}
}