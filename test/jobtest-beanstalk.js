var Scheduler = require('../index').Local.Scheduler;
var LocalQueue = require('../index').Local.Queue;
var BeanstalkClient = require('../index').Beanstalk.Client;

var localQueue = new LocalQueue();

var beanstalkClient = new BeanstalkClient({
	host: 'localhost',
    port: '11300',
	queueName: "jobscheduler"
});

var supervisor = new Supervisor().start(); //the supervisor will start it's nextTick callback loop waiting for work
var scheduler = new Scheduler(supervisor, localQueue); //pass in queue strategy via constructor style DI.

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    taskName: "sample",
    runAt: "1000",
    taskFunc: "test",
    taskArgObj: {str: 'test task1'},
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "foo",
    taskArgObj: {str: 'test task2'},
};


/**
 * enque tasks
 */

try {
    scheduler.schedule(scheduledTask);
	scheduler.schedule(scheduledTask2);
} catch (err) {
    console.error(err);
}
