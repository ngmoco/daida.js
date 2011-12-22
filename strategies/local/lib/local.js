/**
 * Scheduler for batch running a controlled amount of tasks per interval
 */

var util = require('util');

/**
 * return text with given color
 */
function colorize(str, color){
    var colorpalette = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37 };
    return '\x1B[' + colorpalette[color] + 'm' + str + '\x1B[0m';
}

/**
 * dump utility
 */
function dump(obj, color){
  if(color){
    if (typeof obj === 'string'){
      console.info(colorize(obj, color));
    } else {
      console.info(colorize(util.inspect(obj, true, null), color));
    }
  } else {
    if (typeof obj === 'string'){
      console.info(obj);
    } else {
      console.info(util.inspect(obj, true, null));
    }
  }
}

/**
 * The Queue object
 */
var Queue = function localQueue(existingQueueArray){
	this._queue = [];
	if(existingQueueArray instanceof Array){
		this._queue = existingQueueArray;
	}
};

Queue.prototype = {
  queue: function(taskObj){
  // debug purpose only
  var debug = true;

  if (! taskObj){
    throw "task Object not specified. ";
  }

  // max attempts
  //var default_max_attempts = 10; //TODO make this configurable.

  //if(! taskObj.attempts) taskObj.attempts = 0;
  //if(! taskObj.max_attempts) taskObj.max_attempts = default_max_attempts;

  // if runAfter param exists
  if(taskObj.runAfter) {
    if(typeof taskObj.runAfter !== 'number'){
      dump(taskObj.taskName + ': Specified runAfter must be number', "white");
      return;
    }
    taskObj.runAt = new Date(new Date().getTime() + taskObj.runAfter);
  }

  if(debug){
    dump('Job name:        ' + taskObj.taskName, 'green');
    dump('Job will run at: ' + taskObj.runAt, 'green' );
  }

  var job = new Job(taskObj); // a job is a task + a timer that will fire asynchronously
  var worker = new Worker(job); //this is where the setTimeout is actually wrapped around the job

  this._queue.push(job); // save a handle to the job incase we need to stop it before it fires

  //for( taskObj.attempts = 0; taskObj.attempts < taskObj.max_attempts; taskObj.attempts++){
    //try {
      // some logic to watch the task's runtime
      //new Job(taskObj);
    //} catch(err) {
      //dump("An error occured", "red");
      //dump(err, "cyan");
      //taskObj.attempts -= 1;
      //i--;
      // reschedule task till max_attempts;
      //new Job(err, taskObj);
    //}
  }
};


  queueAll: function(tasks){
    if(tasks instanceof Array) {
		for(var task in tasks) {
			this.queue(task);
		}
    }
  },
};

exports.Queue = Queue;

/**
 * The Scheduler Object
 */

// Scheduler constructor
function Scheduler(taskObj){
  // task queue
  //this._jobqueue = [];
  this._jobqueue = new Queue();

  // if task has MQ field, use MQ.queue() for queueing
  if(taskObj.MQ){
    //MQ plugin must support queue API
    taskObj.MQ.queue(taskObj);
  } else {
    //this.runAt = taskObj.runAt;
    this._jobQueue.queue(taskObj);
	//this.start();

	//taskObj.attempts = taskObj.max_attempts;
  }
}

Scheduler.prototype = {
  // can add multiple tasks but not used now.
  addTask: function(task){
    if(task instanceof Array){
		this._jobqueue.queueAll(task);
    } else {
      this._jobqueue.queue(task);
    }
  },

};

/**
 * The Worker Object
 * this is just a glorified job. It allows us the abstraction.
 */

var Worker = function Worker(job) {
	this._job = job;
	this._job.setState("delayed")
};

Worker.prototype = {
	doTask: function(){
		this._job.setState("started");
		this._job.run(); // once this job is running kt should set state to running
		this._job.setState("finished"); // of coursr the above is async so this needs to be at the end of run. msybe usr closure trick from db code

	},

  // start worker
  start: function(){
    if(this.running) return;
    // now() + max_runtime
    var timeout = new Date(this._job.runAt) - new Date();
    //this.call = 0;
    if (timeout >= 0) {
      this.running = true;

      // if we don't use setTimeout, nextTick would be help.
      this._timeoutId = setTimeout(function(self){
        self.running = false;
        self.doTask();
      }, timeout, this);
    } else {
      this.running = false;
      console.error("too late to do it.");
    }
  },
  stop: function(){
    clearTimeout(this._timeoutId);
	this.running = false;
	this._job.setState("stopped");
  }

}

/**
 * JobHandler
 * @param taskObj. data schema is described below.
 *
 * taskObj Data Schema
 * taskObj = {
 *  runAt: "2011/11/10 09:00:00" // datetime, any string can be recognized as an argument of Date()
 *  task: samplefunc // functionName
 *  argumentObj: {str: "test", person: "Bob"} // anything you want to set
 *  max_attempts: 10 // retry
 *
 * };
 */
var Job = function Job(task) {
	if(err){
		console.log('There was an error the last time this job was tried. Error was: ' + error ); //if the task failed last time
	}

	this._task = task;
	this._status = "new";
	//create new worker in here for this job.
}

Job.prototype = {
	setStatus: function(status){
		this._status = status;
	},

	run: function(){
		this.setStatus("running");
		//TODO we should probably pass call back of workers post run function into the task call belw
		// so that when the task is finished async or not it will pass controll back to wlrker to cleanup
		this._task.task.call(this); // this is where the action happens might not be called task check the task objects format
	},
}
exports.Job = Job;
