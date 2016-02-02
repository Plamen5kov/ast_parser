var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "extendDecorator",
		isExtendClassDecorator = false,
		overriddenMethodNames = [],
		classNameFromDecorator = "No decorator name found",
		anotherVisitorString = "none";

	function decoratorVisitor(path, config) {
		extendDecoratorName = config.extendDecoratorName ? config.extendDecoratorName: defaultExtendDecoratorName;
		
		// get extend class name from decorator
		if(t.isDecorator(path.node) && t.isClassDeclaration(path.parent)) {

			// node is our custom class decorator (must be called with parameters)
			if(t.isCallExpression(path.node.expression) && path.node.expression.callee.name === extendDecoratorName) {
				isExtendClassDecorator = true;
				// TODO: think about throwing error if user doesn't follow documented decorator name convention
				// example: 	@extendDecorator("a.b.C") right
				// 		@extendDecorator("a / b / C") wrong
				classNameFromDecorator = path.node.expression.arguments[0].extra.rawValue;

				if(config.logger) {
					config.logger.info(classNameFromDecorator);
				}
			}
		}

		// get extended method names
		if(t.isClassMethod(path)) {
			overriddenMethodNames.push(path.node.key.name);

			if(config.logger) {
				config.logger.info(path.node.key.name);
			}
		}
	}

	decoratorVisitor.getMethodNames = function () {
		return isExtendClassDecorator ? overriddenMethodNames : [];
	}
	decoratorVisitor.getDecoratorClassName = function () {
		return classNameFromDecorator;
	}

	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;