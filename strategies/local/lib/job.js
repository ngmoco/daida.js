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
		//TODO we need to enforce that all tasks accept the call back of
		//workers "post run function" in the taskFunc call below
		//so that when the task is finished async or not it will pass controll
		//back to worker for post task cleanup
		var runnable = function(){ /* noOp */ };
		if(this.taskFunction){
			//the runnable was already on the task.
			runnable = this.taskFunction;
		}
		else {
			runnable = require('../../../handlers/'+this.handlerModule.toLowerCase())[this.handlerFunction];
		}

		if(runnable instanceof Array){
			var accumulator = runnable.length-1;
			var cbWhenAllFinished = function(){
				if(accumulator === 0){
					callback();
				}

				accumulator--;
			};

			for(key in runnable){
				var run = runnable[key];
				run.call(this, this.args, cbWhenAllFinished); // this is where the action happens might not be called task check the task objects format

			}
		} else {
			runnable.call(this, this.args, callback); // this is where the action happens might not be called task check the task objects format
		}
	},
};
exports.Job = Job;
