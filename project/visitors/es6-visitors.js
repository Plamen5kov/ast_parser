var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "JavaProxy",
		isExtendClassDecorator = false,
		isClassDeclaration = false,
		isStringArgument = false,
		isCorrectClassName = false,
		overriddenMethodNames = [],
		extendClass = [],
		classNameFromDecorator = "No decorator name found",
		classDeclarationCount = 0;

	function decoratorVisitor(path, config) {
		classDeclarationCount = 0;
		extendDecoratorName = config.extendDecoratorName ? config.extendDecoratorName: defaultExtendDecoratorName;

		// get extend class name from decorator
		if(t.isDecorator(path.node) && t.isClassDeclaration(path.parent)) {
			
			// node is our custom class decorator (must be called with parameters)
			if(t.isCallExpression(path.node.expression) && path.node.expression.callee.name === extendDecoratorName) {

				if(config.logger) {
					config.logger.info("\t+in extend decorator");
				}

				isExtendClassDecorator = true;

				var decoratorArguments = path.node.expression.arguments;
				var arg0 = decoratorArguments[0];
				isStringArgument = t.isStringLiteral(arg0)
				if (isStringArgument) {
					classNameFromDecorator = arg0.value;
				}

				isCorrectClassName = /^(((\w+\.)+\w+)|(\w+))$/.test(classNameFromDecorator);
			}
		}

		// get extending class
		if(t.isClassDeclaration(path)) {
			if(config.logger) {
				config.logger.info("\t+in class declaration");
			}
			classDeclarationCount++;

			isClassDeclaration = true;
			var o = path.node.superClass;
			if(o) {

				while (true) {
					if (t.isIdentifier(o)) {
						extendClass.push(o.name);
						break;
					}

					extendClass.push(o.property.name);
					o = o.object
				}
			}
		}

		// get extended method names
		if(t.isClassMethod(path)) {

			if(config.logger) {
				config.logger.info("\t+in class method");
			}

			overriddenMethodNames.push(path.node.key.name);
		}
	}

	function clearDataInner() {
		isExtendClassDecorator = false;
		isClassDeclaration = false;
		overriddenMethodNames = [];
		extendClass = [];
		classNameFromDecorator = "No decorator name found";
		classDeclarationCount = 0;	
	}

	decoratorVisitor.clearData = function() {
		clearDataInner();
	}
	decoratorVisitor.getDecoratorClassName = function () {
		 //TODO: specify file in exception
		if(!isExtendClassDecorator) {
			throw "The node you are trying to parse has no class decorator: '" + extendDecoratorName + "', which is required. Example: '" + extendDecoratorName + "(\"a.b.ClassName\")'";
		}
		if(!isStringArgument) {
			throw "The decorator: '" + extendDecoratorName + "' needs to have a string as a first parameter. Example: '" + extendDecoratorName + "(\"a.b.C\")'"
		}
		if(!isCorrectClassName) {
			throw "The argument '" + classNameFromDecorator + "' of the '" + extendDecoratorName + "' decorator is not following the right pattern which is: '[namespace.]ClassName'. Example: 'a.b.ClassName'";
		}
		if(classDeclarationCount > 1) {
			throw "There is more than one class declaration in one file!"
		}

		return classNameFromDecorator;
	}
	decoratorVisitor.getExtendClass = function () {
		return isClassDeclaration ? extendClass.reverse().join(".") : [];
	}
	decoratorVisitor.getMethodNames = function () {
		return isExtendClassDecorator ? overriddenMethodNames : [];
	}
	
	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;