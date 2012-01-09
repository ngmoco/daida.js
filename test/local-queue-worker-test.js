var fs = require('fs');
var Scheduler = require('../index').Scheduler;

//the following context object is going to be made available to the handler
//function via a closure that is created around it. by injecting it into
//the supervisors scope below. Local.inject(context).Supervisor;
//this allows you to access psuedo global variables within the handler function
//by using the context object below as if it were a local variable.
//this is especially handy when multiple different developers are writing
//different handlers but relying upon a similar "configuration" dictionary
//to always be available to them programatically within the handlers.
//this is kind of like accessing environment or container variables.
var context = {
	testContextInjectedVariable: 'foo',

	//the following function mimics the app.set available
	//in express/connect environments
	set: function(key, value){
		if(!value)
			return this[key];
		var oldValue = this[key];
		this[key] = value;
		return oldValue;
	}
};

var log4js = require('../node_modules/log4js');
context.set('log4js', log4js);//sending logger on through to the handler function via injected context

var Supervisor = require('../index').Local.inject(context).Supervisor;//Here is where the closure is created

var LocalQueue = require('../index').Local.Queue;
var localQueue = new LocalQueue();

//If you want to buffer the workers so that they don't start their timers immediately.
var bufferedSupervisorWorkQueue = false;
var pathToJobHandlerRegistry = fs.realpathSync('../handlers');//abs path to the handlers
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
    handlerModule: "Test", // the module name AKA the filename containing the exported object with this name
    runAfter: 1000,  // in msec, means this task will be fired after 10sec
    handlerFunction: "foo", // the function within the above handlerModule (located in the file it represents)
    args: {name: 'baz', str: 'test task1'}
};
var scheduledTask2 = {
	handlerModule: "Sample", //the module name can contain caps here but the filename represented by it must be all lowercase one word.
	runAfter: 3000,
    handlerFunction: "dump",
    args: {name: 'beef', str: 'test task2'} //the args can be any object that is JSON representable. No Functions!
};
var scheduledTask3 = {
    handlerModule: "Sample", // this module is represented by the file ../handlers/sample.js
    runAt: "2011/12/24 08:39:30", //absolute date() format compatible timestamps are supported.
    handlerFunction: "dump",
    args: {str: 'test task1'}
};
var scheduledTask4 = {
    runAfter: 2000,
    taskFunction: function(args, callback){ // can specify function directly in "task" property
		//next we pull log4js variable out of the context local (made available
		//via the scope injection from the closure created above when we
		//required the supervisor)
		var log4js = context.set('log4js');
		var logger = log4js.getLogger('AnonymousTaskFunction');
		logger.info(context.testContextInjectedVariable);
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
