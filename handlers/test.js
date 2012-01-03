/**
 * The test task handler module
 * This module supports the bar and foo task types.
 * NOTE: all task type handler functions must take a callback
 * as their last parameter and execute that callback when the
 * task is finished. If no callback is passed you can simply
 * call a noOp function defined in the fashion found below.
 */

var handlers = {

  bar: function(data, cb) {
    var callback = cb || function() { /* noOp */ };
    console.log('test job passed data: ' + JSON.stringify(data));
    callback();
  },

  foo: function(data, cb) {
    var callback = cb || function() { /* noOp */ };
    console.log('foo job passed name'+ data.name);
    callback();
  },

};
exports.handlers = handlers;

exports.bar = handlers.bar;
exports.foo = handlers.foo;
