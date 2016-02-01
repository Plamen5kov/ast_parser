@extendDecorator("a.b.C")
class A{
	classFunc() {
		var a = android.widget.Button.extend({
			onClick: function () {
				console.log('click happened');
			}
		});	
	}
	
}
