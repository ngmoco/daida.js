var util = require('util');

exports.handlerNamespace = "Sample";

var handlers = {
	dump: function(taskObj, cb){
		var callback = cb || function() { /* noOp */ };
		console.log(util.inspect(taskObj));
		console.log(taskObj.str);
		callback();
	},

	dump2: function(taskObj, cb){
		var callback = cb || function() { /* noOp */ };
		console.log(util.inspect(taskObj));
		console.log(taskObj.str);
		callback();
	},
}
exports.handlers = handlers;
exports.dump = handlers.dump;
exports.dump2 = handlers.dump2;
