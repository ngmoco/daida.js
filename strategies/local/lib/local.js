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

		if (!taskObj){
			throw "task Object not specified. ";
		}

		// if runAfter param exists
		if(taskObj.runAfter) {
			if(typeof taskObj.runAfter !== 'number'){
				dump(taskObj.taskName + ': Specified runAfter must be number', "white");
				return false;
			}
			taskObj.runAt = new Date(new Date().getTime() + taskObj.runAfter);
		}

		var job = new Job(taskObj); // a job is a task + a timer that will fire asynchronously
		var worker = new Worker(job); //this is where the setTimeout is actually wrapped around the job

		this._queue.push(job); // save a handle to the job incase we need to stop it before it fires

	},

	queueAll: function(tasks){
		if(tasks instanceof Array) {
			for(var task in tasks) {
				this.queue(task);
			}
			return true;
		}
		return false;
	},
};

exports.Queue = Queue;

/**
 * The Scheduler Object
 */

// Scheduler constructor
function Scheduler(queue){
  // task queue
  this._jobqueue = queue; //here we dependency inject constructor style
};

Scheduler.prototype = {
  // can add multiple tasks but not used now.
  schedule: function(task){
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

	var timeout = new Date(this._job.runAt) - new Date();

    if (timeout >= 0) {
		this._job.setState(this._job.STATES.DELAYED);
		// if we don't use setTimeout, nextTick would be help.
		this._timeoutId = setTimeout(function(self){
			self.work();
		}, timeout, this);
	}
};

Worker.prototype = {
	work: function(){
		this._job.setState(this._job.STATES.STARTED);
		try{
			this._job.run(function(error){
				if(error){
					this._job.setState(this._job.STATES.FAILED);
				}
				else {
					this._job.setState(this._job.STATES.FINISHED); // of coursr the above is async so this needs to be at the end of run. msybe usr closure trick from db code
				}
			}.bind(this));
		} catch (Error e){
               this._job.setState(this._job.STATES.FAILED);
		}

	},

	cancel: function(){
		//we can only cancel a job if it hasn't started
		if(this._job.getState >= this._job.STATES.RUNNING)
			return false;

		clearTimeout(this._timeoutId);
		this._job.setState(this._job.STATES.STOPPED);
		return true;
	},
};

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
	this._task = task;
	this.setState(this.STATES.NEW);
	//create new worker in here for this job.

	this.STATES = {
		'NEW': 0,
		'QUEUED': 1,
		'DELAYED': 2,
		'RUNNING': 3,
		'FINISHED': 4,
		'STOPPED': 5,
		'FAILED': 6,
	}
}

Job.prototype = {
	setState: function(state){
		this._status = state;
		console.log('state changed to' + state);
	},

	run: function(callback){
		this.setState(this.STATES.RUNNING);
		//TODO we need to enforce that all tasks accept the call back of
		//workers "post run function" in the taskFunc call below
		//so that when the task is finished async or not it will pass controll
		//back to worker for post task cleanup
		this._task.taskFunc.call(this, this._task.taskArgObj, callback); // this is where the action happens might not be called task check the task objects format
	},
};
exports.Job = Job;
