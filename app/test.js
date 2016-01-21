var app = require('application');

function start() {
	var ButtonExtend = android.widget.Button.extend({
		onClick: function () {
			console.log('click happened');
		}
	});
	
	var context = app.android.context;
	var btn = new ButtonExtend(context);
}

