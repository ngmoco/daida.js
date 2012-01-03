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
	this._id = 0;
	this._task = task;
	this.setState(this.STATES.NEW);

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

	setId: function(job_id){
		this._id = job_id;
	},

	setState: function(state){
		this._status = state;
	},

	run: function(callback){
		this.setState(this.STATES.RUNNING);
		//TODO we need to enforce that all tasks accept the call back of
		//workers "post run function" in the taskFunc call below
		//so that when the task is finished async or not it will pass controll
		//back to worker for post task cleanup
		var runnable = function(){ /* noOp */ };
		if(this.task){
			//the runnable was already on the task.
			runnable = this.task;
		}
		else {
			runnable = require('../../../handlers/'+this.handlerNamespace.toLowerCase())[this.handlerFunction];
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
