var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "JavaProxy",
		linesToWrite = [];


	function decoratorVisitor(path, config) {
		if(!config.filePath) {
			config.filePath = "No file path provided";
		}

		// anchor is extend
		if (t.isMemberExpression(path) && path.node.property.name === "extend") {
			traverseNormalExtend(path, config);
		}

		//anchor is JavaProxy
		var customDecoratorName = config.extendDecoratorName === undefined ? defaultExtendDecoratorName : config.extendDecoratorName;
		if(t.isIdentifier(path) && path.node.name === customDecoratorName) {
			traverseJavaProxyExtend(path, config, customDecoratorName);
		}
	}

	decoratorVisitor.getExtendInfo = function () {
		return linesToWrite;
	}

	function traverseJavaProxyExtend(path, config, customDecoratorName) {
		if(config.logger) {
			config.logger.info("\t+in "+customDecoratorName+" anchor");
		}

		var classNameFromDecorator = getDecoratorArgument(path, config, customDecoratorName),
			extendClass = getArgumentFromNodeAsString(path, config),
			overriddenMethodNames = getOverriddenMethods(path);

		var lineToWrite = "Java File: " + classNameFromDecorator + " - Extend Class: " + extendClass + " - Overridden Methods: " + overriddenMethodNames;
		if(config.logger) {
			config.logger.info(lineToWrite)
		}
		linesToWrite.push(lineToWrite)
	}

	function traverseNormalExtend(path, config) {
		if(config.logger) {
			config.logger.info("\t+in extend anchor");
		}

		var overriddenMethodNames = [],
			extendClass = [],
			classNameFromDecorator = "No decorator name found";

		var callee = path.parent.callee;
		if(!callee) {
			throw {
				// TODO: specify file
				message: "You need to specify a name of the 'extend'. Example: '...extend(\"a.b.C\", {...overrides...})'), file: " + config.filePath,
				errCode: 1
			}
		}

		var o = callee.object
		if(o) {
			while (true) {
				if (t.isIdentifier(o)) {
					extendClass.push(o.name)
					break;
				}

				extendClass.push(o.property.name)
				o = o.object
			}
		}

		var arg0 = path.parent.arguments[0];
		if (t.isStringLiteral(arg0)) {
			classNameFromDecorator = arg0.value;
		}
		else {
			throw {
				// TODO: specify file
				message: "The 'extend' you are trying to make needs to have a string as a first parameter. Example: '...extend(\"a.b.C\", {...overrides...})', file: " + config.filePath,
				errCode: 1
			}
		}

		var isCorrectClassName = testJavaProxyName(classNameFromDecorator);
		if(!isCorrectClassName) {
			throw {
				// TODO: specify file
				message: "The first argument '" + classNameFromDecorator + "' of the 'extend' function is not following the right pattern which is: 'namespace.[(namespace.)]ClassName'. Example: '...extend(\"a.b.ClassName\", {overrides...})', file: " + config.filePath,
				errCode: 1
			}
		}

		var arg1 = path.parent.arguments[1];

		if(t.isObjectExpression(arg1)) {
			var objectProperties = arg1.properties;
			for(var index in objectProperties) {
				overriddenMethodNames.push(objectProperties[index].key.name)
			}
		}
		else {
			throw {
				// TODO: specify file
				message: "The extend you are trying to make needs to have an object as a second parameter. Example: '...extend(\"a.b.C\", {...overrides...})', file: " + config.filePath,
				errCode: 1
			}
		}

		var lineToWrite = "Java File: " + classNameFromDecorator + " - Extend Class: " + extendClass.reverse().join(".") + " - Overridden Methods: " + overriddenMethodNames;
		if(config.logger) {
			config.logger.info(lineToWrite)
		}
		linesToWrite.push(lineToWrite)
	}

	function getArgumentFromNodeAsString(path, config) {

		var extClassArr = [];
		var extendedClass =  getParrent(path, 8, config);

		if(extendedClass) {
			if(t.isCallExpression(extendedClass.node)) {
				var o = extendedClass.node.arguments[0];	
			}
			else {
				throw {
					message: "Node type is not a call expression. File" + config.filePath,
					errCode: 1
				}
			}
		}

		while(o !== undefined) {
			
			if(!t.isMemberExpression(o)) {
				extClassArr.push(o.name)
				break;
			}
			
			extClassArr.push(o.property.name) //these are member expressions
			o = o.object;
		}

		return extClassArr.reverse().join(".");
	}

	function getDecoratorArgument(path, config, customDecoratorName) {
		if(path.parent && t.isCallExpression(path.parent)) {

			if(path.parent.arguments && path.parent.arguments.length > 0) {

				var classNameFromDecorator = path.parent.arguments[0].value
				var isCorrectClassName = testJavaProxyName(classNameFromDecorator);
				if(isCorrectClassName) {
					return path.parent.arguments[0].value;
				}
				else {
					throw {
						message: "The first argument '" + classNameFromDecorator + "' of the "+customDecoratorName+" decorator is not following the right pattern which is: '[namespace.]ClassName'. Example: '"+customDecoratorName+"(\"a.b.ClassName\", {overrides...})', file: " + config.filePath,
						errCode: 1
					}
				}
			}
			else {
				throw {
					message: "No arguments passed to "+customDecoratorName+" decorator. Example: '"+customDecoratorName+"(\"a.b.ClassName\", {overrides...})', file: " + config.filePath,
					errCode: 1
				}
			}
		}
		else {
			throw { 
				message: "Decorator "+customDecoratorName+" must be called with parameters: Example: '"+customDecoratorName+"(\"a.b.ClassName\", {overrides...})', file: " + config.filePath,
				errCode: 1
			}
		}
		return undefined;
	}

	function getOverriddenMethods(path) {
		var methods = [];

		var cn = getParrent(path, 6)

		// this pattern follows typescript generated syntax
		for(var item in cn.node.body) {
			var ci = cn.node.body[item];
			if(t.isExpressionStatement(ci)) {
				if(t.isAssignmentExpression(ci.expression)) {
					if(ci.expression.left.property) {
						methods.push(ci.expression.left.property.name)
					}
				}
			}
		}

		return methods;
	}

	function getParrent(node, numberOfParrents, config) {
		if(!node) {
			throw {
				message: "No parent found for node in file: " + config.filePath,
				errCode: 1
			}
		}
		if(numberOfParrents === 0) {
			return node;
		}

		return getParrent(node.parentPath, --numberOfParrents)
	}

	function testJavaProxyName(name) {
		return /^((\w+\.)+\w+)$/.test(name)
	}

	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;