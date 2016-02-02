var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "extendDecorator",
		isExtendClassDecorator = false,
		overriddenMethodNames = [],
		extendClass = [],
		classNameFromDecorator = "No decorator name found";

	function decoratorVisitor(path, config) {

		if (t.isMemberExpression(path) && path.node.property.name === "extend") {
			isExtendClassDecorator = true;

			var o = path.parent.callee.object
			
			while (true) {
				config.logger.info(o.property.name)
				extendClass.push(o.property.name)
				o = o.object
				if (t.isIdentifier(o)) {
					config.logger.info(o.name)
					extendClass.push(o.name)
					break;
				}
			}

			var arg0 = path.parent.arguments[0];
			var arg1 = path.parent.arguments[1];
			if (t.isStringLiteral(arg0)) {
				config.logger.info(arg0.value)
				classNameFromDecorator = arg0.value;
			}
			else {
				throw "The extend you are trying to make needs to have a string as a first parameter. Example: '...extend(\"a.b.C\", {...overrides...})'"
			}

			if(t.isObjectExpression(arg1)) {
				var objectProperties = arg1.properties;
				for(var index in objectProperties) {
					overriddenMethodNames.push(objectProperties[index].key.name)
				}
			}
			else {
				throw "The extend you are trying to make needs to have an object as a second parameter. Example: '...extend(\"a.b.C\", {...overrides...})'"
			}
		}
	}

	decoratorVisitor.getMethodNames = function () {
		return isExtendClassDecorator ? overriddenMethodNames : [];
	}
	decoratorVisitor.getExtendClass = function () {
		return isExtendClassDecorator ? extendClass.reverse().join(".") : [];
	}
	decoratorVisitor.getDecoratorClassName = function () {
		return classNameFromDecorator;
	}

	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;