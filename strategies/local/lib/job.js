/**
 * The Job object
 * This is just a glorified task. It allows for some abstraction.
*/
var Job = function Job(task) {
	this._id = 0;
	this._task = task;
	this.setState(this.STATES.NEW);
	this._runnable = function(){ /* noOp */ }; // This will remain noOp until a supervisor assigns it to a workeu

	//now consume all the fields from the task:
	for(key in task){
		if(task.hasOwnProperty(key))
			this[key] = task[key];
	}
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

	setId: function(id){
		this._id = id;
	},

	getId: function(){
		return this._id;
	},

	setState: function(state){
		this._state = state;
	},

	getState: function(){
		return this._state;
	},

	setRunnable: function(runnable){
		this._runnable = runnable;
	},

	getRunnable: function(){
		return this._runnable;
	},

	run: function(callback){
		this.setState(this.STATES.RUNNING);

		if(this._runnable instanceof Array){
			var accumulator = 0;
			var cbWhenAllFinished = function(error){
				if(error){
					//if we have an error thrown by one of he handler functions
					//we should return immediately. we can't know if it will
					//effect the rest of them. So we effectively cancel all.
					//the following will set the state of this job to FAILED
					//and call the workers error callback with the message
					callback(error, null);
					return;
				}

				if(accumulator >= this._runnable.length){
					callback();
				}
				accumulator++;

				var nextRunnable = this._runnable[accumulator];
				if('function' === typeof nextRunnable){
					var run = nextRunnable;
					run.call(this, this.args, cbWhenAllFinished); // this is where the action happens might not be called task check the task objects format

				}
			};

		} else {
			this._runnable.call(this, this.args, callback); // this is where the action happens might not be called task check the task objects format
		}
	},
};
exports.Job = Job;
