/*
 * The test of the beanstalk worker
 */
var Worker = require('../job-beanstalk').Worker;

var options = {
  workers: 3,
  server: '127.0.0.1:11300',
  tubes: ['jobscheduler'],
  ignore_default: true,
  handlers: ['../../registry/test', ]
};

var worker1 = new Worker(options);
worker1.work(); //aka worker1.start();
