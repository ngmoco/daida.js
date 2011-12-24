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
				if(this._supervisor){
					this._supervisor.addJob(job,
						this.postRunCallback.bind(this),
						this.errorCallback.bind(this)
					);
				}
            }
		} else {
			var job = this._jobqueue.queue(task);
			if(this._supervisor){
				this._supervisor.addJob(job,
					this.postRunCallback.bind(this),
					this.errorCallback.bind(this)
				);
			}
		}
	},

	errorCallback: function(error, job){
		console.error('There was an error with the job. Error was: ' + error);
		this.queueError(job);
	},

	postRunCallback: function(job){
		this.dequeueJob(job);
	},

	queueError: function(job){
		this._errorQueue.push(job);
	},

	dequeueJob: function(job){
		this._jobqueue.dequeue(job);
	}
};

exports.Scheduler = Scheduler;
