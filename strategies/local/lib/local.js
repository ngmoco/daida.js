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

		job.ID = this._queue.push(job); // save a handle to the job incase we need to stop it before it fires

		return job;
	},

	queueAll: function(tasks){
		if(tasks instanceof Array) {
			var jobs = [];
			for(task in tasks) {
				jobs.push(this.queue(tasks[task]));
			}
			return jobs;
		}
	},

	dequeue: function(job_id){
		var job = this.queue[job_id];
		delete this.queue[job_id];
		return job;
	},

};

exports.Queue = Queue;

var Supervisor = function Supervisor(){
 	this._workers = [];
	this.numWorkers = 0;//handle the possibility of sparse arrays
	this._runnable = false;
};

Supervisor.prototype = {
	addJob: function(job, pre_run_cb, error_cb) {
		var worker = new Worker(job);
		worker.setPreRunCallback(pre_run_cb);
		worker.setPostRunCallback(this.workerDone);
		worker.setErrorCallback(this.workerError(error_cb)); //pass in the closure creator result with job error cb
		worker.setID(this._workers.push(worker)); //this way the worker knows where it is in the workers array
		this.numWorkers++;
	},

	workerError: function(job_error_cb){
		return function(worker){
			this.workerDone(worker);
			job_error_cb(worker._job);
		}
	},

	workerDone: function(worker){
		//this is where we could handle any errors thrown by the job.
		//like putting it into a failed queue of some sort
		this.numWorkers--;
		delete this.workers[worker.ID]; //we don't want to use splice since it will re-shuffle the array.
	},

	isWorkFinished: function(){
		return this.numWorkers === 0;
	},

	stop: function(){
		this._runnable = false; //everything will stop on next trip around the event loop
	},

	start: function(callback) {
		this._runnable = true;
		this.run(callback);
	},

	run: function(callback) {
		if(!this._runnable)
			callback(true); //someone called stop. so send it on home!

		if(this.isWorkFinished()){
			process.nextTick(this.run);
		} else {
			for(key in this._workers){
				var worker = this._workers[key];
				if(!worker.isRunning)
					worker.run();
			}
		}
	}
};

exports.Supervisor = Supervisor;

/**
 * The Scheduler Object
 */

// Scheduler constructor
var Scheduler = function Scheduler(supervisor, queue){
	//we expect that sometimes we will only receive a queue
	//this is dependent on the strategy being used
	if(!queue){
		queue = supervisor;
		supervisor = null;
	}

	// task queue
	this._jobqueue = queue; //here we dependency inject constructor style
	this._supervisor = supervisor;

	this._errorQueue = []; //TODO turn this into a richer object;
};

Scheduler.prototype = {
	// can add multiple tasks but not used now.
	schedule: function(task){
		if(task instanceof Array){
			var jobs = this._jobqueue.queueAll(task);
            for(key in jobs){
				var job = jobs[key];
				if(supervisor){
					this._supervisor.addJob(job,
						function(){
							this.dequeueJob(job);
						},
						function(){
							this.queueError(job);
						}
					);
				}
            }
		} else {
			var job = this._jobqueue.queue(task);
			if(supervisor){
				this._supervisor.addJob(job,
					function(){
						this.dequeueJob(job);
					},
					function(){
						this.queueError(job);
					}
				);
			}
		}
	},

	queueError: function(job){
		this._errorQueue.push(job);
	},

	dequeueJob: function(job){
		this._jobqueue.dequeue(job);
	}
};

exports.Scheduler = Scheduler;

/**
 * The Worker Object
 * this is just a glorified job. It allows us the abstraction.
 */

var Worker = function Worker(job, pre_run_cb, post_run_cb, error_cb) {
	this.ID = 0;
	this._job = job;
	this.isRunning = false;
	this.preRunCallback = pre_run_cb;
	this.postRunCallback = post_run_cb;
	this.errorCallBack = error_call_cb;
};

Worker.prototype = {

	setPreRunCallback: function(pre_run_cb) {
		this.preRunCallback = pre_run_cb;
	},

	setPostRunCallback: function(post_run_cb){
		this.postRunCallback = post_run_cb;
	},

	setErrorCallback: function(error_cb){
		this.errorCallback = error_cb;
	},

	run: function(){
		if(!this.errorCallback)
			this.errorCallback = function(error) {
				console.log(error);
				throw Error(error);
			};

		if(this.isRunning)
			this.errorCallback('Already Running');

		this.isRunning = true;

		var timeout = new Date(this._job.runAt) - new Date();

		if (timeout >= 0) {
			this._job.setState(this._job.STATES.DELAYED);
			// if we don't use setTimeout, nextTick would be help.
			this._timeoutId = setTimeout(function(self){
				self.work(self.preRunCallback, self.postRunCallback, self.errorCallback); //this should be set by the scheduler via dependency injection setter style
			}, timeout, this);
		}
	},

	work: function(pre_run_cb, post_run_cb, error_cb){
		pre_run_cb(); //this is where the job should be dequeued;
		this._job.setState(this._job.STATES.STARTED);
		try{
			this._job.run(function(error){
				if(error){
					this._job.setState(this._job.STATES.FAILED);
				}
				else {
					this._job.setState(this._job.STATES.FINISHED); // of coursr the above is async so this needs to be at the end of run. msybe usr closure trick from db code
					post_run_cb(null, this);
				}
			}.bind(this));
		} catch (err){
			this._job.setState(this._job.STATES.FAILED);
			error_cb(err, this);
		}

	},

	cancel: function(){
		//we can only cancel a job if it hasn't started
		if(this._job.getState >= this._job.STATES.RUNNING)
			return false;

		clearTimeout(this._timeoutId);
		this._job.setState(this._job.STATES.STOPPED);
		this.isRunning = false;
		return true;
	},
};

exports.Worker = Worker;

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
};

Job.prototype = {
	STATES: {
		'NEW': 0,
		'QUEUED': 1,
		'DELAYED': 2,
		'RUNNING': 3,
		'FINISHED': 4,
		'STOPPED': 5,
		'FAILED': 6,
	},

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
