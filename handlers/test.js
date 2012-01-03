
exports.handlerNamespace = 'Test';

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
exports.handlers = handlers; // for node_beanstalk_worker compat
exports.bar = handlers.bar;
exports.foo = handlers.foo;
