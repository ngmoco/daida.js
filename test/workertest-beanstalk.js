/*
 * The test of the beanstalk worker
 */
var Worker = require('../strategies/beanstalk').Worker;

var options = {
  workers: 3,
  server: '127.0.0.1:11300',
  tubes: ['jobscheduler'],
  ignore_default: true,
  handlers: ['../../../registry/test', ] //these have to be relative to where the Worker code is located (see Worker require above)
};

var worker1 = new Worker(options);
worker1.work(); //aka worker1.start();
