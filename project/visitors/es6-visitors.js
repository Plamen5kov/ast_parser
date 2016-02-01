var es6_visitors = (function () {
	var defaultExtendDecoratorName = "extendDecorator";
	var t = require("babel-types");
	function decoratorVisitor(path, config) {
		
		extendDecoratorName = config.extendDecoratorName ? config.extendDecoratorName: defaultExtendDecoratorName;
		
		// node is class decorator
		if(t.isDecorator(path) && t.isClassDeclaration(path.parent)) {
			// node is our custom class decorator (must be called with parameters)
			if(t.isCallExpression(path.node.expression) && path.node.expression.callee.name === extendDecoratorName) {
				
				// TODO: think about throwing error if user doesn't follow documented decorator name convention
				// example: 	@extendDecorator("a.b.C") right
				// 		@extendDecorator("a / b / C") wrong
				var classNameFromDecorator = path.node.expression.arguments[0].extra.rawValue;
				if(config.logger) {
					config.logger.info(classNameFromDecorator);	
				}
			}
		}
	}
	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;