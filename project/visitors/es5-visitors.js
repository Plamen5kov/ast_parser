var es5_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "JavaProxy",
		customExtendsArr = [],
		normalExtendsArr = [],
		interfacesArr = []

	// traverses each passed node with several visitors
	// result from visit can be got from static methods
	function customExtendVisitor(path, config) {
		if(!config.filePath) {
			config.filePath = "No file path provided";
		}

		if(path.node.skipMeOnVisit) {
			return;
		}
	// // ES5 Syntax (normal extend pattern + custom extend pattern) 
	// 	// anchor is extend
	// 	if (t.isMemberExpression(path) && path.node.property.name === "extend") {
	// 		traverseNormalExtend(path, config);
	// 	}

	// // ES5 Syntax (interface pattern)
	// 	//anchor is new keyword
	// 	if(t.isNewExpression(path)) {
	// 		traverseInterface(path, config);
	// 	}

	// Parsed Typescript to ES5 Syntax (normal extend pattern + custom extend pattern)
		// anchor is __extends (optional)
		if(t.isIdentifier(path) && path.node.name === "__extends") {

			var extendArguments = _getArgumentFromNodeAsString(path, 5, config)
			var overriddenMethods = _getOverriddenMethodsTypescript(path, 3)
			// check the found names in some list with predefined classes
			console.log(extendArguments)
			console.log(overriddenMethods)

			// check for _decorate
			var iifeRoot = _getParrent(path, 3)
			var body = iifeRoot.node.body;
			for(var index in body) {
				var ci = body[index];
				if(t.isExpressionStatement(ci) && 
						t.isAssignmentExpression(ci.expression) &&
						ci.expression.right.callee && 
						ci.expression.right.callee.name === "__decorate" &&
						ci.expression.right.arguments &&
						t.isArrayExpression(ci.expression.right.arguments[0])) {

					// console.log(ci._paths)
					for(var i in ci.expression.right.arguments[0].elements) {
						var currentDecorator = ci.expression.right.arguments[0].elements[i]

						if(t.isCallExpression) {
							if(currentDecorator.callee.name === config.extendDecoratorName) {
								currentDecorator.callee.skipMeOnVisit = true;
								var customDecoratorName = config.extendDecoratorName === undefined ? defaultExtendDecoratorName : config.extendDecoratorName;
								traverseJavaProxyExtend(currentDecorator._paths[0], config, customDecoratorName);
							}
						}
					}
				}
			}
			//
		}

	// !!! maybe it's not a good idea to expose this scenario !!!
	// !!! this scenario can be used but it has to be made explicitly !!!
		// //anchor is JavaProxy (optional)
		// var customDecoratorName = config.extendDecoratorName === undefined ? defaultExtendDecoratorName : config.extendDecoratorName;
		// if(t.isIdentifier(path) && path.node.name === customDecoratorName) {
			// if(path.node.skipMeOnVisit) {
			// 	return;
			// }
			// console.log("enters because there is a java proxy down the way")
			// traverseJavaProxyExtend(path, config, customDecoratorName);
		// }

	}

	customExtendVisitor.getProxyExtendInfo = function () {
		return customExtendsArr;
	}

	customExtendVisitor.getCommonExtendInfo = function () {
		return normalExtendsArr;
	}

	customExtendVisitor.getInterfaceInfo = function() {
		return interfacesArr;
	}

//possible to expose these methods
	function traverseInterface(path, config) {
		if(!config.interfaceNames) {
			throw "No interface names are provided! You can pass them in config.interfaceNames as an array!"
		}

		var o = path.node.callee,
			interfaceArr = _getWholeName(o),
			foundInterface = false,
			interfaceNames = config.interfaceNames

		var currentInterface = interfaceArr.reverse().join(".");
		for(var i in interfaceNames) {
			var interfaceName = interfaceNames[i].trim();
			if(interfaceName === currentInterface) {
				currentInterface = interfaceName;
				foundInterface = true;
				break;
			}
		}

		if(foundInterface) {
			var arg0 = path.node.arguments[0];
			var overriddenInterfaceMethods = _getOverriddenMethods(arg0, config);
			var line = currentInterface + " - " +  overriddenInterfaceMethods.join(",")
			interfacesArr.push(line)
		}
	}

	function traverseJavaProxyExtend(path, config, customDecoratorName) {
		if(config.logger) {
			config.logger.info("\t+in "+customDecoratorName+" anchor");
		}

		var classNameFromDecorator = _getDecoratorArgument(path, config, customDecoratorName),
			extendClass = _getArgumentFromNodeAsString(path, 8, config),
			overriddenMethodNames = _getOverriddenMethodsTypescript(path, 6);

		var lineToWrite = "Java File: " + classNameFromDecorator + " - Extend Class: " + extendClass + " - Overridden Methods: " + overriddenMethodNames;
		if(config.logger) {
			config.logger.info(lineToWrite)
		}
		customExtendsArr.push(lineToWrite)
	}

	function traverseNormalExtend(path, config) {
		if(config.logger) {
			config.logger.info("\t+in extend anchor");
		}

		var overriddenMethodNames = [],
			extendClass = [],
			className = "No decorator name found";

		var callee = path.parent.callee;
		if(!callee) {
			throw {
				message: "You need to call 'extend'. Example: '...extend(\"a.b.C\", {...overrides...})'), file: " + config.filePath,
				errCode: 1
			}
		}

		var o = callee.object
		extendClass = _getWholeName(o);

		var arg0 = path.parent.arguments[0];
		if (t.isStringLiteral(arg0)) {
			className = arg0.value;
		}
		else {
			throw {
				message: "The 'extend' you are trying to make needs to have a string as a first parameter. Example: '...extend(\"a.b.C\", {...overrides...})', file: " + config.filePath,
				errCode: 1
			}
		}

		var isCorrectExtendClassName = _testJavaProxyName(className);
		var isCorrectClassname = _testClassName(className)

		if(!isCorrectExtendClassName && !isCorrectClassname) {
			throw {
				message: "The 'extend' you are trying to make has an invalid name, file: " + config.filePath,
				errCode: 1
			}
		}
		//if we don't throw this exception multiple extends will be allowed in one file (think if this is necessary)
		// if(!isCorrectExtendClassName) {
		// 	throw {
		// 		message: "The first argument '" + className + "' of the 'extend' function is not following the right pattern which is: 'namespace.[(namespace.)]ClassName'. Example: '...extend(\"a.b.ClassName\", {overrides...})', file: " + config.filePath,
		// 		errCode: 1
		// 	}
		// }

		var arg1 = path.parent.arguments[1];
		overriddenMethodNames = _getOverriddenMethods(arg1, config);

		var lineToWrite = "Java File: " + className + " - Extend Class: " + extendClass.reverse().join(".") + " - Overridden Methods: " + overriddenMethodNames;
		if(isCorrectExtendClassName) {
			if(config.logger) {
				config.logger.info(lineToWrite)
			}
			
			customExtendsArr.push(lineToWrite)
		}
		if(isCorrectClassname) {
			if(config.logger) {
				config.logger.info(lineToWrite)
			}
			
			normalExtendsArr.push(lineToWrite)
		}
	}

	// you have to pass the right node or the method won't traverse right
	function _getOverriddenMethods(node, config) {
		var overriddenMethodNames = [];
		if(t.isObjectExpression(node)) {
			var objectProperties = node.properties;
			for(var index in objectProperties) {
				overriddenMethodNames.push(objectProperties[index].key.name)
			}
		}

		return overriddenMethodNames;
	}

	function _getWholeName(node) {
		var arr = [],
			isAndroidInterface = false;

		while (node !== undefined) {
			if (!t.isMemberExpression(node)) {					
				if(isAndroidInterface) {
					arr.push(node.name)
				}
				break;
			}

			isAndroidInterface = true;
			arr.push(node.property.name)
			node = node.object
		}

		return arr;
	}

	function _getArgumentFromNodeAsString(path, count, config) {

		var extClassArr = [];
		var extendedClass =  _getParrent(path, count, config);

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

		extClassArr = _getWholeName(o);

		return extClassArr.reverse().join(".");
	}

	function _getDecoratorArgument(path, config, customDecoratorName) {
		if(path.parent && t.isCallExpression(path.parent)) {

			if(path.parent.arguments && path.parent.arguments.length > 0) {

				var classNameFromDecorator = path.parent.arguments[0].value
				var isCorrectExtendClassName = _testJavaProxyName(classNameFromDecorator);
				if(isCorrectExtendClassName) {
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

	function _getOverriddenMethodsTypescript(path, count) {
		var methods = [];

		var cn = _getParrent(path, count)

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

	function _getParrent(node, numberOfParrents, config) {
		if(!node) {
			throw {
				message: "No parent found for node in file: " + config.filePath,
				errCode: 1
			}
		}
		if(numberOfParrents === 0) {
			return node;
		}

		return _getParrent(node.parentPath, --numberOfParrents)
	}

	function _testJavaProxyName(name) {
		return /^((\w+\.)+\w+)$/.test(name)
	}

	function _testClassName(name) {
		return /^(\w+)$/.test(name)
	}

	return {
		customExtendVisitor: customExtendVisitor
	}
})();

module.exports = es5_visitors;