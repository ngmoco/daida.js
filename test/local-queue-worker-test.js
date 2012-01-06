var Scheduler = require('../index').Scheduler;
var Supervisor = require('../index').Local.Supervisor;
var LocalQueue = require('../index').Local.Queue;

var localQueue = new LocalQueue();

//If you want to buffer the workers so that they don't start their timers immediately.
var bufferedSupervisorWorkQueue = false;
var pathToJobHandlerRegistry = require('fs').realpathSync('../handlers');
var supervisor = new Supervisor(pathToJobHandlerRegistry, bufferedSupervisorWorkQueue);
var scheduler = new Scheduler(localQueue, supervisor, null); //pass in queue strategy via constructor style DI.

// If you are using a buffered supervisor work queue you will need
// to run the supervisor.start() method.
// Which will start a background (aka nextTick polling)
// process in order for jobs to be pickedup
//supervisor.start();

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    handlerModule: "Test",
    runAfter: 1000,
    handlerFunction: "foo",
    args: {name: 'baz', str: 'test task1'},
};
var scheduledTask2 = {
    handlerModule: "Test",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    handlerFunction: "bar",
    args: {name: 'beef', str: 'test task2'},
};
var scheduledTask3 = {
    handlerModule: "Sample",
    runAt: "2011/12/24 08:39:30",
    handlerFunction: "dump",
    args: {str: 'test task1'},
};
var scheduledTask4 = {
    runAfter: 2000, // msec, means this task will be fired after 10sec
    taskFunction: function(args, callback){ // can specify function directly in "task" property
		console.log('local task');
		callback();
    }
};
var scheduledTask5 = {
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunction: [function test(args, callback){ // can use array here.
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

scheduler.schedule(scheduledTask);
scheduler.schedule(scheduledTask2);
scheduler.schedule(scheduledTask3);
scheduler.schedule(scheduledTask4);
scheduler.schedule(scheduledTask5);

//Remember to turn off the supervisor polling if you are using
//buffered work queues
//setTimeout(function(){supervisor.stop();},10000);//kill the supervisor after 10 seconds.
