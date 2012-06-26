# Daida.js 
===========

Daida is a scheduler module for use with Beanstalk or by itself. The only requirement is node.js.

Daida has the following components:

* Scheduler: A broker for the scheduling strategies. Accepts tasks via its schedule() method and, depending on its context (dependency injected strategy, etc.), composes a Job object representing the task and schedules it in a strategies queue.
* Scheduling strategies: See below.
* Tasks: Object litterals representing the work to be done and when.
* Jobs: Wrappers around tasks with context (strategy) specific extras.
* Task Handlers: Pre-defined objects containing static functions to execute tasks. Handlers are not required; tasks can have their handler functions defined directly on themselves. A library of task handlers can be pre-defined and used on seperate machines that host-only workers who have no references back to the code that originally scheduled the task.

Scheduling strategies are implementations of persisting and executing tasks at scheduled times. Strategies differ in approaches to complexity, durrability and availability. However, all adhere to the same interface/protocol for queueing tasks. Additionally, all strategies accept the same task format. Thus, strategies are interchangable to meet changing complexity/durrability/availability requirements. Currently, there are 2 strategies:

* Local (tasks are persisted in memory and executed within the same node process as the code that originally scheduled the task)
* Beanstalk (tasks are persisted on a separate Beanstalkd server and remain in the queue until their scheduled time at which point a matching nodejs worker process is notified that the task is ready to be executed)

Also, all scheduling strategies contain AT LEAST the following modules:

* Queue - An object implmenting at least the queue() method, which accepts new tasks.
* Worker - An object implementing at least the work() method, which starts listening for executable tasks.

The local strategy is special; it combines both queue and worker modules into the same process. However, for clarity and reusability, we seperate the code for the 2 objects into different modules. Even though the local stratagy executes within the same thread as the scheduler, it is asynchronous by using process.nextTick to avoid blocking any other events while the timer is running. For more information about the async processing, see the Supervisor module within the local strategy.

Daida (代打) is Japanese, meaning pinch-hitting.

## Install
===========
1. `git clone` this repo.

2. `npm install` from within the working copy to install the known strategies.

NOTE: If you have custom strategies put them into the strategies folder. Any strategy in the strategies folder should export a 'folder as a module' (in the node.js fashion) that has the same name as the folder in which it is contained, but CamelCased. It is preferable if the folder name is lower case, however. For more information about node 'folders as modules' see: [http://nodejs.org/docs/v0.6.7/api/modules.html#folders](http://nodejs.org/docs/v0.6.7/api/modules.html#folders_as_Modules)

Or, you can install this module via npm, using "npm install daida".

## Usage
=========

### Queueing

We seperate the begining of the example into local and non-local versions because of the difference in the instantion of the scheduler below. This is because the local strategy has a dependency on the supervisor object. Later, we converge and finish the example with the common code for creating and scheduling tasks.

#### Non-Local Strategies

```javascript
	var Scheduler = require('daida').Scheduler;
	var BeanstalkQueue = require('daida').Beanstalk.Queue;

	//Instantiate a new queue object passing in require configuration object
	//this is particular to the strategy being used. Here we use Beanstalk.
	var beanstalkQueue = new BeanstalkQueue({
		host: 'localhost', //the ip or hostname of the beanstalkd server
	    	port: '11300', //the port beanstalkd is listening on
		queueName: "jobscheduler" //the beanstalk tube to insert new tasks into
	});

	var scheduler = new Scheduler(beanstalkQueue); //pass in queue strategy via constructor style DI.
```

#### Local Strategy (Default)

```javascript
	var Scheduler = require('daida').Scheduler;
	var Supervisor = require('daida').Local.Supervisor;
	var LocalQueue = require('daida').Local.Queue;

	var localQueue = new LocalQueue(); //Local in memory perisistence of tasks.

	var bufferedSupervisorWorkQueue = false; //This will tell the supervisor to start job timers immediately. Defaults to false;
	var pathToJobHandlerRegistry = require('fs').realpathSync('../handlers'); //This is the abs path to the handlers folder
	var supervisor = new Supervisor(pathToJobHandlerRegistry, bufferedSupervisorWorkQueue); //The supervisor will start its nextTick callback loop waiting for work once you call start()

	var scheduler = new Scheduler(localQueue, supervisor, null); //Pass in the supervisor and also the queue strategy via constructor style DI.

```

#### Local Strategy (Buffered)

The local strategy has the ability to buffer jobs in its supervisor without starting their timers. The benefit is you have more fine-grained control of when your
system will start processing jobs. This is handy in the local strategy since jobs are running in the same thread
as the application queuing them. Executing tasks can saturate your node process, defeating the purpose of deferring them in the
first place. You can allow your application to queue as normal, but only process queued jobs when you have
a surplus of system resources (e.g. CPU-time, memory). How this is done is left up to you, but it is possible to programatically start and stop
the supervisor on command. A caveat to this is: you may have jobs whose task definition contains an absolute "runAt"
timestamp which may expire while the supervisor is "sleeping". Should the supervisor, run after an absolute "runAt" time, tasks will 
will instantly fail due to timer expirations. You can mitigate this by using relative "runAfter" task
definitions. Also know that while a buffered supervisor is "running," it will poll the buffer for new
jobs. This polling is fast and uses a small process.nextTick loop to check for new jobs but it does cause single
processor systems to spike as node will use 100% cpu on those systems. This is due to the fact that the event loop is never
allowed to completely empty (the polling). It is for this reason that it is less advisable to use the local buffered
strategy on workstations or other smaller machines.

```javascript
	var Scheduler = require('daida').Scheduler;
	var Supervisor = require('daida').Local.Supervisor;
	var LocalQueue = require('daida').Local.Queue;

	var localQueue = new LocalQueue(); //Local in memory perisistence of tasks.

	var bufferedSupervisorWorkQueue = true; //This will tell the supervisor to start job timers immediately
	var pathToJobHandlerRegistry = require('fs').realpathSync('../handlers'); //This is the abs path to the handlers folder
	var supervisor = new Supervisor(pathToJobHandlerRegistry, bufferedSupervisorWorkQueue); //The supervisor will start its nextTick callback loop waiting for work once you call start()

	var scheduler = new Scheduler(localQueue, supervisor, null); //Pass in the supervisor and also the queue strategy via constructor style DI.

	//The following will start the supervisor's work loop. It can be done at any point in your application.
	//It will cause the supervisor to process any jobs that have been buffered and continue to poll the 
	//buffer for new jobs. This polling can be cpu intensive (even though it's using process.nextTick underneath)
	//and on single processor systems this can cause the node process to eat up 100% of the cpu.
	//however you can turn it on and off programatically at your whim.
	//NOTE: ONLY NEEDED FOR BUFFERED SUPERVISORS! See: README.md under "Local Strategy (Buffered)"
	supervisor.start(); 
```

#### All Strategies

```javascript
	var scheduledTask1 = {
	    handlerModule: 'Test', //corresponds to the file handlers/test.js
	    runAfter: 3000, // msec, means this task will be fired after 3 sec
	    handlerFunction: "bar", //corresponds to the function bar(args, callback)
	    args: {name: 'beef', str: 'test task2'},
	};
	var scheduledTask2 = {
	    handlerModule: 'Test',
	    runAt: "2011/12/24 08:39:30", //timestamp (formats supported by Date() are ok)
	    handlerFunction: 'foo',
	    args: {name: 'beans', str: 'test task1'},
	};

	/**
	 * enqueue tasks
	 */

	scheduler.schedule(scheduledTask1);
	scheduler.schedule(scheduledTask2);
```

#### Local ONLY: Runtime handler function definitions

The local strategy has the additional capability of allowing runtime task function definitions. This allows you to delay defining the action a task will take until you are actually about to queue the task. Of course this means you cannot run the task on other processes. It has to be run within the same thread that queues the task!

```javascript
	var scheduledTask3 = {
	    runAfter: 2000, // msec, means this task will be fired after 2 sec
	    taskFunction: function(args, callback){ // can specify function directly in "task" property
			console.log('local task');
			callback();
	    }
	};
	var scheduledTask4 = {
	    runAfter: 3000, // msec, means this task will be fired after 3 sec
	    taskFunction: [function test(args, callback){ // can use array here.
			console.log('first local task');
			callback();
	      },
	      function test2(args, callback) {
			  console.log('second local task');
			  callback();
	      }
	    ]
	};

	/**
	 * enqueue tasks
	 */
	
	scheduler.schedule(scheduledTask3);
	scheduler.schedule(scheduledTask4);
	
	//Remember to kill the supervisor if it is polling so that your script will exit cleanly
	//NOTE: The following is ONLY needed in the local BUFFERED strategy. See README.md Local Strategy (Buffered) for more information. 
	setTimeout(function(){supervisor.stop();},10000);//kill the supervisor after 10 seconds.

```

#### Local Strategy (Buffered) ONLY: Killing Supervisor (when polling)

In order to have your code exit cleanly, you will need to kill off the supervisor object which will indefinitely listen for new work. Notice the above setTimeout to kill the supervisor after 10 seconds of work. The call to supervisor.stop() commands the supervisor to cleanly shutdown on its pass through the event loop.

## Working
===========

All strategies have worker objects that use handlers to act on tasks when scheduled. However, each strategy implements its workers differently, because the persistence of tasks is different depending on the strategy. Strategies can again be seperated into local and non-local strategies. The local strategy is able to access the memory space of the code that originaly queued the tasks to be executed BUT it is not advisable to rely upon it. You will end up with very strange race conditions and un-portable code (moving to non-local strategies won't work.)

### Local Strategy

Nothing needs to be done! The local strategy automatically handles the workers as well. You can thank the supervisor for that.

### Beanstalk Strategy

```javascript
	var Worker = require('daida').Beanstalk.Worker;

	var options = {
		server: '127.0.0.1:11300', //the beanstalkd hostname or ip and port concatenated with a colon
		tubes: ['jobscheduler'], //the queue/tube to listen to for new jobs

		//The following is an array of abs paths to handlers this worker should use
		handlers: [
			require('fs').realpathSync('./handlers/test.js'), 
			require('fs').realpathSync('./handlers/sample.js'),
		]
	};

	var worker = new Worker(options);
	worker.work();
```

## Handlers
============

Handlers are the common objects that contain methods invoked by workers as determined by task definitions. Methods are static and have a common method signature allowing them to take an arguments object and callback. When executed, handlers run their pre-defined code with the context passed via the arguments. It is possible for the handlers to contain code modifying external resources such as databases and filesystems but take care, when using non-local strategies, to insure external resources are available at the location of the worker process running the handler method. Think about the situation where there is seperate hardware between the code that queues a task and the code that executes the task's handler function. In general it is advisable to avoid mutating external resources and furthermore to try to make tasks idempotent. Of course this is not always possible.

### All Strategies

```javascript
	var handlers = {
		bar: function(data, cb) {
			var callback = cb || function() { /* noOp */ }; //if for some reason callback wasn't passed
			console.log('test job passed data: ' + JSON.stringify(data));
			callback(); //always make sure to callback!!!!
		},

		foo: function(data, cb) {
			var callback = cb || function() { /* noOp */ };
			console.log('foo job passed name'+ data.name);
			callback(); //again never forget to callback!!!
		},
	};
	exports.handlers = handlers;

	exports.bar = handlers.bar;
	exports.foo = handlers.foo;
```

## Authors
===========

Yusuke Shinozaki (yshinozaki - shinozaki.yusuke@dena.jp)

Jesse Sanford (jsanford - jsanford@ngmoco.com)

## License
===========

Copyright (c) 2011, 2011 ngmoco LLC -- ngmoco:)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
