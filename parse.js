var fs = require("fs"),
	babelParser = require("babylon");

var outFile = "out/ast.txt";

var readFile = function (currentFilePath) {
	return new Promise(function (resolve, reject) {
		fs.readFile(currentFilePath, function (err, data) {
			if(data) {
				console.log("\t +got content of file!");
				resolve(data.toString());
			}
			if(err) {
				console.log("\t +DIDN'T get content of file!");
				console.log(err);
				reject(false);
			}
		});
	});
}

var astFromFileContent = function (data, err) {
	return new Promise(function (resolve, reject) {

		if(data) {
			console.log("\t +parsing ast from file!");
			var ast = babelParser.parse(data);
			// var ast = babelParser.parse("var = 4"); //try if error handling works ok
			resolve(ast);
		}
		if(err) {
			console.log("\t +DIDN'T parse ast from file!");
			//todo: pass some kind of err
			reject(false);
		}
	});
};

var writeToFile = function(data, err) {
	return new Promise (function (resolve, reject) {
	 	fs.writeFile(outFile, JSON.stringify(data), function (fileError) {

			if(err) {
				console.log("\t +DIDN'T write to file!");
				reject(false);
			}

			if(fileError) {
				reject(fileError);
			}
			console.log("\t +wrote to file: " + outFile);
			resolve(data);
		});
	});
}

//todo: implement and require from another file
var visitorsPackage = {
	"decoratorVisitor": function decoratorVisitor() {},
	"extendVisitor": function extendVisitor() {},
	"classVisitor": function classVisitor() {}
}

var visitAst = function (data, err) {
	return new Promise (function (resolve, reject) {
		if(data) {
			console.log("\t +visiting ast with given visitor library!");
			visitWith(data, visitorsPackage);
		}
		if(err) {
			console.log("\t +DIDN'T visit ast!");
			reject(false);
		}
	});
}

var visitWith = function(ast, visitorsForEs5) {
	console.log("\t +visiting happens here");
}

var exceptionHandler = function (reason) {
	console.log("Caught error: " + reason);
}

readFile("app/test.js").then(astFromFileContent)
			.then(writeToFile) //fluent api for debugging purposes
			.then(visitAst)
			.catch(exceptionHandler)