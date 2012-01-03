/*
 * The test of the beanstalk worker
 */
var Worker = require('../index').Beanstalk.Worker;

var options = {
	workers: 3,
	server: '127.0.0.1:11300',
	tubes: ['jobscheduler'],
	ignore_default: true,

	//the following have to be relative to where the Worker code is located (see Worker require above)
	handlers: [
		'../../../handlers/test',
		'../../../handlers/sample',
	]
};

var worker1 = new Worker(options);
worker1.work(); //aka worker1.start();
