 /**
 * The Scheduler Object
 */

// Scheduler constructor
var Scheduler = function Scheduler(queue, supervisor, logger){

	this._logger = logger || console; //default to console if logger is not give

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
					this._supervisor.supervise(
						job,
						this.preRunCallback.bind(this),
						this.postRunCallback.bind(this),
						this.errorCallback.bind(this)
					);
				}
            }
		} else {
			var job = this._jobqueue.queue(task);
			if(this._supervisor){
				this._supervisor.supervise(
					job,
					this.preRunCallback.bind(this),
					this.postRunCallback.bind(this),
					this.errorCallback.bind(this)
				);
			}
		}
	},

	errorCallback: function(error, job){
		this._logger.error('Job: ' + job._id + ' had an error. Error was: ' + error);
		this.queueError(job);
	},

	preRunCallback: function(job){
		this._logger.info('Job: ' + job._id + '  checking in for preRunCallback');
		//TODO decide if we want to dequeue on
		// the job being started or when it's finished.
		this.dequeueJob(job);
	},

	postRunCallback: function(job){
		this._logger.info('Job: ' + job._id + ' finished.');
	},

	queueError: function(job){
		this._errorQueue.push(job);
	},

	dequeueJob: function(job){
		this._jobqueue.dequeue(job);
	}
};

exports.Scheduler = Scheduler;
