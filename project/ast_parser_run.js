var execFileSync = require('child_process').execFile;

function config() {
	return new Promise(function (resolve, reject) {
		console.log("in config");
		var child = execFileSync('node', ['parse.js'], function(error, stdout, stderr) {
			console.log("in config callback");
			if (error) {
				console.log()
				throw error;
			}
			console.log("------");
			console.log(stdout);
			resolve(true);
		});
	});
}

function init() {
	return new Promise(function (resolve, reject) {
		console.log("in init");
		var child = execFileSync('node', ['--version'], function(error, stdout, stderr) {
			console.log("in init callback");
			if (error) {
				console.log("err from init")
				throw error;
			}
			console.log(stdout);
			resolve(true);
		});
	});
}

function execute() {
	return new Promise(function (resolve, reject) {
		console.log("in execute");
		var child = execFileSync('node', ['--version'], function(error, stdout, stderr) {
			console.log("in execute callback");
			if (error) {
				console.log("err from execute")
				throw error;
			}
			console.log(stdout);
			resolve(true);
		});
	});
}

config().then(init).then(execute).catch(function (err) {
	console.log("eeeeerrrr: " + err);
})