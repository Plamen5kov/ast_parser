
(function () {
	var MyButton = android.widget.Button.extend("my.custom.Class", {
		onClick: function () {
			console.log('click happened');
		},
		onClick1: function () {
			console.log('click happened');
		}
	});
})();

// @extendDecorator("my.custom.Class")
// class SomeRandomClass extends android.app.Activity {
	
// 	constructor(constructorParameter) {
// 	}
	  
// 	classFunc() {
// 	}
	
// 	methodSimple() {
// 	}
	
// 	methodWithParameters(paramOne) {
// 	}
// }