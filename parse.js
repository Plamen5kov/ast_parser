var fs = require("fs"),
	babelParser = require("babylon");

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

var astFromFileContent = function (success, err) {
	return new Promise(function (resolve, reject) {

		if(success) {
			console.log("\t +parsing ast from file!");
			var ast = babelParser.parse("var = 4");
			resolve(ast);
		}
		if(err) {
			console.log("\t +DIDN'T parse ast from file!");
			//todo: pass some kind of err
			reject(false);
		}
	});
};

//todo: implement and require from another file
var visitorsPackage = {
	"decoratorVisitor": function decoratorVisitor() {},
	"extendVisitor": function extendVisitor() {},
	"classVisitor": function classVisitor() {}
}

var visitAst = function (success, err) {
	return new Promise (function (resolve, reject) {
		if(success) {
			console.log("\t +visiting ast with given visitor library!");
			visitWith(success, visitorsPackage);
		}
		if(err) {
			console.log("\t +DIDN'T visit ast!");
			//todo: pass some kind of err
			reject(false);
		}

	});
}

var visitWith = function(ast, visitorsForEs5) {
	console.log("\t +visiting happens here");
}


readFile("app/test.js").then(astFromFileContent).then(visitAst).catch(function (reason) {
	console.log(reason);
})