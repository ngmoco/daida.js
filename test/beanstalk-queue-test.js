var Scheduler = require('../index').Scheduler;
var BeanstalkClient = require('../index').Beanstalk.Client;

var beanstalkQueue = new BeanstalkClient({
	host: 'localhost',
    port: '11300',
	queueName: "jobscheduler"
});

var scheduler = new Scheduler(beanstalkQueue); //pass in queue strategy via constructor style DI.

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    taskName: "test",
    runAfter: 1000,
    taskFunc: "foo",
    taskArgObj: {name: 'baz', str: 'test task1'},
};
var scheduledTask2 = {
    taskName: "test",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "bar",
    taskArgObj: {name: 'beef', str: 'test task2'},
};
var scheduledTask3 = {
    taskName: "sample",
    runAt: "2011/12/24 08:39:30",
    taskFunc: "dump",
    taskArgObj: {str: 'test task1'},
};
var scheduledTask4 = {
    //local task will be fired with setTimeout
    taskName: "localTask",
    runAfter: 2000, // msec, means this task will be fired after 10sec
    task: function(args, callback){ // can specify function directly in "task" property
		console.log('local task');
		callback();
    }
};
var scheduledTask5 = {
    //local task will be fired with setTimeout
    taskName: "localTask2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    task: [function test(args, callback){ // can use array here.
		console.log('first local task');
		callback();
      },
      function test2(args, callback){
		  console.log('second local task');
		  callback();
      }
    ]
};


/**
 * enqueue tasks
 */

try {
	scheduler.schedule(scheduledTask);
	scheduler.schedule(scheduledTask2);
	scheduler.schedule(scheduledTask3);
	scheduler.schedule(scheduledTask4);
	scheduler.schedule(scheduledTask5);
} catch (err) {
    console.error(err);
}
