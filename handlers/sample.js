/**
 * The sample task handler module
 * This module supports the bar and foo task types.
 * NOTE: all task type handler functions must take a callback
 * as their last parameter and execute that callback when the
 * task is finished. If no callback is passed you can simply
 * call a noOp function defined in the fashion found below.
 */

var util = require('util');

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
};
exports.handlers = handlers;

exports.dump = handlers.dump;
exports.dump2 = handlers.dump2;
