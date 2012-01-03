/**
 * The Queue object
 * This is the in memory task store.
 */

var Job = require('./job').Job;

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

		job.setId(this._queue.push(job)); // save a handle to the job incase we need to stop it before it fires

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
