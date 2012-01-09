# NGCore-Server-Scheduler

This is the scheduler library for the NGCore-Server application. This scheduler library contains the following primary components.

The Scheduler: The broker object for all of the scheduling strategies. Accepts tasks via it's schedule() method and depending on it's context (dependency injected strategy etc) it composes a Job object representing the task and schedules it in the particular strategies queue.

Scheduling strategies: See below.

Tasks: The object litterals representing the work to be done and when.

Jobs: A wrapper around the task with context (strategy) specific extras.

Task Handlers: The pre-defined objects that contain the static functions to be used to execute the tasks. These are not required as tasks can have their handler functions defined directly on themselves. However a library of task handlers can be pre-defined and then used on seperate physical machines that host only workers who have no references back to the code that original scheduled the task.

The scheduling strategies are the individual implementations of persisting and executing the tasks at their scheduled time. The strategies differ in their approaches to things like complexity, durrability and availability but all of them adhere to the same interface/protocol for queueing new tasks. Additionally all of the strategies accept the same task format. In this fashion strategies can be interchanged to meet changing complexity/durrability/availability requirements. Currently there are three strategies:

Local (tasks are persisted in memory and executed within the same node process as the code that originally scheduled the task)
RabbitMQ (tasks are persisted on a seperate RabbitMQ server until picked up by a matching nodejs worker process which will start a timer and wait to execute the task at the scheduled time)
Beanstalk (tasks are persisted on a separate Beanstalkd server and remain in the queue until their scheduled time at which point a matching nodejs worker process is notified that the task is ready to be executed)

As well all scheduling strategies contain AT LEAST the following modules:
Queue (an object that implments at least the queue() method which accepts new tasks)
Worker (an object that implements at least the work() method which starts listening for executable tasks)

The local strategy is somewhat special as it combines both queue and worker modules into the same running process however for the purposes of clarity and reusability we continue to seperate the code for the two objects into seperate modules. It should be noted that even though the local stratagy executes within the same thread it is infact fully asynchronous as it uses process.nextTick to refrain from blocking any parallel execution while the timer is running. For more information about the afformentioned async processing see the Supervisor module within the local strategy.

## Usage

### Queueing

We seperate the begining of the example into local and non-local versions because of the difference in the instantion of the scheduler below. This is because the local strategy has the additional dependency on the supervisor object. We converge and finish the example with the common code for creating and scheduling tasks.

#### Non-Local Strategies

```javascript
	var Scheduler = require('../index').Scheduler;
	var BeanstalkQueue = require('../index').Beanstalk.Queue;

	//Instantiate a new queue object passing in require configuration object
	//this is particular to the strategy being used. Here we use Beanstalk.
	var beanstalkQueue = new BeanstalkQueue({
		host: 'localhost',
	    port: '11300',
		queueName: "jobscheduler"
	});

	var scheduler = new Scheduler(beanstalkQueue); //pass in queue strategy via constructor style DI.
```

#### Local Strategy

```javascript
	var Scheduler = require('NG-Core-Scheduler').Scheduler;
	var Supervisor = require('NG-Core-Scheduler').Local.Supervisor;
	var LocalQueue = require('NG-Core-Scheduler').Local.Queue;

	var localQueue = new LocalQueue(); //Local in memory perisistence of tasks.

	var supervisor = new Supervisor(); //the supervisor will start it's nextTick callback loop waiting for work once you call start()

	var scheduler = new Scheduler(supervisor, localQueue); //pass in the supervisor and also the queue strategy via constructor style DI.

	supervisor.start(); //start the supervisor's work loop.
```

#### All Strategies

```javascript
	var scheduledTask2 = {
	    handlerModule: "Test", //corresponds to the file handlers/test.js
	    runAfter: 3000, // msec, means this task will be fired after 10sec
	    handlerFunction: "bar", //corresponds to the function bar(args, callback)
	    args: {name: 'beef', str: 'test task2'},
	};
	var scheduledTask3 = {
	    handlerModule: "Sample",
	    runAt: "2011/12/24 08:39:30", //timestamp (formats supported by Date() are ok)
	    handlerFunction: "foo",
	    args: {name: 'beans', str: 'test task1'},
	};

	/**
	 * enqueue tasks
	 */

	try {
		scheduler.schedule(scheduledTask);
		scheduler.schedule(scheduledTask2);
	} catch (err) {
	    console.error(err);
	}
```

#### Local ONLY: Runtime handler function definition

The local strategy has the additional capability of allowing runtime task function definitions. This allows you to delay defining the action a task will take until you are actually about to queue the task. Of course this means you cannot run the task on other processes. It has to be run within the same thread that queues the task!

```javascript
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
	
	try {
		scheduler.schedule(scheduledTask4);
		scheduler.schedule(scheduledTask5);
		setTimeout(function(){supervisor.stop();},10000);//kill the supervisor
		//after 10 seconds.
	} catch (err) {
	    console.error(err);
	}
```

#### Local ONLY: Killing Supervisor

Finally it should be noted that in order to have your code exit cleanly you will need to kill off the supervisor object which otherwise will indefinitely listen for new work. Notice the above setTimeout to kill the supervisor after 10 seconds of work. The call to supervisor.stop(); will tell the supervisor to cleanly shutdown on it's next trip around the event loop.

## Working

All strategies have worker objects that can use the common handler objects to take action on tasks when their time has come. BUT each strategy implements it's workers differently. This is because the persistence of the tasks is fundamentally different depending on the strategy. However the strategies can again be seperated into local and non-local strategies. The local strategy has the benefit of being able to access the memory space of the code that originaly queued the tasks to be executed BUT it is not advisable to rely upon it. You will end up with very strange race conditions and un-portable code (moving to non-local strategies won't work.)

### Local Strategy

Nothing needs to be done! The local strategy automatically handles the workers as well. You can thank the supervisor for that.

### Beanstalk Strategy

```javascript
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
	worker1.work();
```

### RabbitMQ Strategy

```javascript
	var RabbitMQWorker = require('../index').RabbitMQ.Worker;

	var rabbitMQWorker = new RabbitMQWorker(
	    // RabbitMQ configuration
	    {
	        queueName: "jobs",
	        queueOption: { autoDelete: true, durable: true, exclusive: false }
	    });
	rabbitMQWorker.addRegistry('../../../handlers/sample.js'); //this is relative to the location of the RabbitMQWorker file above (see JW require)
	rabbitMQWorker.work();
```

## Handlers

Handlers are the common objects that contain the methods that are invoked by workers as determined by the task definitions. The methods are static and have a common method signature which allows them to take in an arguments object and a callback. When executed they run their pre-defined code with only the context passed via the arguments. It is possible for the handlers to contain code that modifies external resources such as databases / filesystems but great care should be taken especially when using the non-local strategies to insure that the external resources will be available at the location of the worker process which will be running the handler method. Think about the situation where their is seperate physical hardware between the code that queues a task and the code that executes the task's handler function. In general itis advisable to avoid mutating external resources and furthermore to try to make tasks idempotent. Of course this is not always possible.

### All Strategies

```javascript
	var handlers = {
		bar: function(data, cb) {
			var callback = cb || function() { /* noOp */ };
			console.log('test job passed data: ' + JSON.stringify(data));
			callback();
		},

		foo: function(data, cb) {
			var callback = cb || function() { /* noOp */ };
			console.log('foo job passed name'+ data.name);
			callback();
		},
	};
	exports.handlers = handlers;

	exports.bar = handlers.bar;
	exports.foo = handlers.foo;

## Authors

Yusuke Shinozaki (yshinozaki - shinozaki.yusuke@dena.jp)
Jesse Sanford (jsanford - jsanford@ngmoco.com)

## License

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