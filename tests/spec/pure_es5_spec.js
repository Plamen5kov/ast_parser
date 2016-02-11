var exec = require("child_process").exec,
	path = require("path"),
	fs = require("fs"),
	prefix = path.resolve(__dirname, "../alltests/");

describe("pure es5", function(){
	it("normal extended class with overridden methods, should be parsed without errors",function(done){

		var testFolder = "es5_normal_input_and_output";
			inputDir = prefix + "/"+testFolder+"/input",
			actualFile = prefix + "/"+testFolder+"/actualOutput/parsed.txt",
			expectedFile = prefix + "/"+testFolder+"/expectedOutput/parsed.txt"

		exec("node transpiled_ts_parser.js " + inputDir + " " + actualFile, function (err) {

			var expectedContent = fs.readFileSync(expectedFile, "utf-8");
			var actualContent = fs.readFileSync(actualFile, "utf-8");

			expect(err).toBe(null)
			expect(expectedContent).toBe(actualContent);

			done();
		})
	})

	it("when first parameter is not string or missing, an error should be thrown",function(done){

		var testFolder = "es5_called_with_wrong_parameter_first";
			inputDir = prefix + "/"+testFolder+"/input"

		var ex = exec("node transpiled_ts_parser.js " + inputDir, function (err, stdout, stderr) {

			expect(stderr.indexOf("needs to have a string as a first parameter")).not.toBe(-1);
			expect(err).not.toBe(null)
			expect(err.code).toBe(4);

			done();
		})
	})

	it("when second parameter is not an object, an error should be thrown",function(done){

		var testFolder = "es5_called_with_wrong_parameter_second";
			inputDir = prefix + "/"+testFolder+"/input"

		var ex = exec("node transpiled_ts_parser.js " + inputDir, function (err, stdout, stderr) {
			
			expect(stderr.indexOf("needs to have an object as a second parameter")).not.toBe(-1);
			expect(err).not.toBe(null)
			expect(err.code).toBe(4);

			done();
		})
	})

	it("when extend is called with no parameters, an error should be thrown",function(done){

		var testFolder = "es5_called_with_no_parameters";
			inputDir = prefix + "/"+testFolder+"/input"

		var ex = exec("node transpiled_ts_parser.js " + inputDir, function (err, stdout, stderr) {

			expect(stderr.indexOf("needs to have a string as a first parameter")).not.toBe(-1);
			expect(err).not.toBe(null)
			expect(err.code).toBe(4);

			done();
		})
	})

	it("when extend is not called on declaration an error should be thrown",function(done){

		var testFolder = "es5_extend_not_called_on_declared";
			inputDir = prefix + "/"+testFolder+"/input"

		var ex = exec("node transpiled_ts_parser.js " + inputDir, function (err, stdout, stderr) {

			expect(stderr.indexOf("You need to call 'extend'")).not.toBe(-1);
			expect(err).not.toBe(null)
			expect(err.code).toBe(4);

			done();
		})
	})

	it("when file has multiple extended classes should be parsed without errors",function(done){

		var testFolder = "es5_multiple_extends_in_a_file";
			inputDir = prefix + "/"+testFolder+"/input",
			actualFile = prefix + "/"+testFolder+"/actualOutput/parsed.txt",
			expectedFile = prefix + "/"+testFolder+"/expectedOutput/parsed.txt"

		exec("node transpiled_ts_parser.js " + inputDir + " " + actualFile, function (err) {

			var expectedContent = fs.readFileSync(expectedFile, "utf-8");
			var actualContent = fs.readFileSync(actualFile, "utf-8");

			expect(err).toBe(null)
			expect(expectedContent).toBe(actualContent);

			done();
		})
	})
});