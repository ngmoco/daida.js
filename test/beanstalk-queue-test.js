var Scheduler = require('../index').Scheduler;
var BeanstalkQueue = require('../index').Beanstalk.Queue;

var beanstalkQueue = new BeanstalkQueue({
	host: 'localhost',
    port: '11300',
	queueName: "jobscheduler"
});

var scheduler = new Scheduler(beanstalkQueue); //pass in queue strategy via constructor style DI.

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    handlerNamespace: "Test",
    runAfter: 1000,
    handlerFunction: "foo",
    args: {name: 'baz', str: 'test task1'},
};
var scheduledTask2 = {
    handlerNamespace: "Test",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    handlerFunction: "bar",
    args: {name: 'beef', str: 'test task2'},
};
var scheduledTask3 = {
    handlerNamespace: "Sample",
    runAt: "2011/12/24 08:39:30",
    handlerFunction: "dump",
    args: {name: 'beans', str: 'test task1'},
};

/**
 * enqueue tasks
 */

try {
	scheduler.schedule(scheduledTask);
	scheduler.schedule(scheduledTask2);
	scheduler.schedule(scheduledTask3);
} catch (err) {
    console.error(err);
}
