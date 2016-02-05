var es6_visitors = (function () {
	var t = require("babel-types"),

		defaultExtendDecoratorName = "extendDecorator",
		isExtendKeyWord = false,
		overriddenMethodNames = [],
		extendClass = [],
		classNameFromDecorator = "No decorator name found";

	function decoratorVisitor(path, config) {

		if (t.isMemberExpression(path) && path.node.property.name === "extend") {

			if(config.logger) {
				config.logger.info("\t+in extend function");
			}

			isExtendKeyWord = true;

			var callee = path.parent.callee;
			if(!callee) {
				throw "You need to specify a name of the 'extend'. Example: '...extend(\"a.b.C\", {...overrides...})')";
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
				throw "The 'extend' you are trying to make needs to have a string as a first parameter. Example: '...extend(\"a.b.C\", {...overrides...})'"
			}

			var isCorrectClassName = /^(((\w+\.)+\w+)|(\w+))$/.test(classNameFromDecorator);
			if(!isCorrectClassName) {
				throw "The first argument '" + classNameFromDecorator + "' of the 'extend' function is not following the right pattern which is: '[namespace.]ClassName'. Example: '...extend(\"a.b.ClassName\", {overrides...})'";
			}

			var arg1 = path.parent.arguments[1];

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

	decoratorVisitor.clearData = function() {
		defaultExtendDecoratorName = "extendDecorator",
		isExtendKeyWord = false,
		overriddenMethodNames = [],
		extendClass = [],
		classNameFromDecorator = "No decorator name found";
	}
	decoratorVisitor.getDecoratorClassName = function () {
		if(!isExtendKeyWord) {
			throw {
				// TODO: specify file
				message: "There is no 'extend' keyword used in this file! You need to extend a native class! Example: 'some.android.Class.extend(\"my.java.Class\", {overrides...})'",
				errCode: 1
			}
		}
		return classNameFromDecorator;
	}
	decoratorVisitor.getExtendClass = function () {
		return isExtendKeyWord ? extendClass.reverse().join(".") : [];
	}
	decoratorVisitor.getMethodNames = function () {
		return isExtendKeyWord ? overriddenMethodNames : [];
	}

	return {
		decoratorVisitor: decoratorVisitor
	}
})();

module.exports = es6_visitors;