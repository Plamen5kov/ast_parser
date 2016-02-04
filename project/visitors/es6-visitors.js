var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "JavaProxy",
		isExtendClassDecorator = false,
		isClassDeclaration = false,
		isClassDecorator = false,
		overriddenMethodNames = [],
		extendClass = [],
		classNameFromDecorator = "No decorator name found",
		classDeclarationCount = 0;

	function decoratorVisitor(path, config) {
		extendDecoratorName = config.extendDecoratorName ? config.extendDecoratorName: defaultExtendDecoratorName;
		
		// get extend class name from decorator
		if(t.isDecorator(path.node) && t.isClassDeclaration(path.parent)) {
			isClassDecorator = true;
			// node is our custom class decorator (must be called with parameters)
			if(t.isCallExpression(path.node.expression) && path.node.expression.callee.name === extendDecoratorName) {

				if(config.logger) {
					config.logger.info("\t+in extend decorator");
				}

				isExtendClassDecorator = true;

				var decoratorArguments = path.node.expression.arguments;
				if(decoratorArguments.length > 1) {
					throw "There are more than one arguments passed to the '" + extendDecoratorName + "' decorator!"
				}

				var arg0 = decoratorArguments[0];
				if (t.isStringLiteral(arg0)) {
					classNameFromDecorator = arg0.value;
				}
				else {
					throw "The decorator: '" + extendDecoratorName + "' needs to have a string as a first parameter. Example: '" + extendDecoratorName + "(\"a.b.C\")'"
				}

				var isCorrectClassName = /^(((\w+\.)+\w+)|(\w+))$/.test(classNameFromDecorator);
				if(!isCorrectClassName) {
					throw "The argument '" + classNameFromDecorator + "' of the '" + extendDecoratorName + "' decorator is not following the right pattern which is: '[namespace.]ClassName'. Example: 'a.b.ClassName'";
				}
			}
		}

		// get extending class
		if(t.isClassDeclaration(path)) {
			if(config.logger) {
				config.logger.info("\t+in class declaration");
			}
			classDeclarationCount++;

			if(classDeclarationCount > 1) {
				throw "There is more than one class declaration in one file!" //TODO: specify file!
			}

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

	decoratorVisitor.clearData = function() {
		isExtendClassDecorator = false;
		isClassDeclaration = false;
		isClassDecorator = false;
		overriddenMethodNames = [];
		extendClass = [];
		classNameFromDecorator = "No decorator name found";
		classDeclarationCount = 0;
	}
	decoratorVisitor.getDecoratorClassName = function () {
		if(!isExtendClassDecorator) {
			throw "The node you are trying to parse has no class decorator: '" + extendDecoratorName + "', which is required. Example: '" + extendDecoratorName + "(\"a.b.ClassName\")'";
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