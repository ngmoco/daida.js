var handlers = {

  test: function(data, cb) {
    var callback = cb || function() { /* noOp */ };
    require('sys').puts('test job passed data: ' + JSON.stringify(data));
    callback();
  },

  foo: function(data, cb) {
    var callback = cb || function() { /* noOp */ };
    console.log('foo job passed name'+ data.name);
    callback();
  },

};
exports.handlers = handlers; // for node_beanstalk_worker compat
exports.test = handlers.test;
exports.foo = handlers.foo;
