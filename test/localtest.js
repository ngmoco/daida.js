var Scheduler = require('../index').Scheduler;
var Supervisor = require('../index').Local.Supervisor;
var LocalQueue = require('../index').Local.Queue;

var localQueue = new LocalQueue();

var supervisor = new Supervisor(); //the supervisor will start it's nextTick callback loop waiting for work
var scheduler = new Scheduler(supervisor, localQueue); //pass in queue strategy via constructor style DI.

supervisor.start();

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


/**
 * enque tasks
 */

try {
    scheduler.schedule(scheduledTask);
	scheduler.schedule(scheduledTask2);
	setTimeout(function(){supervisor.stop();},10000);//kill the supervisor after 10 seconds.
} catch (err) {
    console.error(err);
}
