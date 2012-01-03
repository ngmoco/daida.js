/**
 * The Worker object
 * this is just a glorified job. It allows us the abstraction.
 */

var Worker = function Worker(job, pre_run_cb, post_run_cb, error_cb) {
	this._id = 0;
	this._job = job;
	this.isRunning = false;
	this.preRunCallback = pre_run_cb;
	this.postRunCallback = post_run_cb;
	this.errorCallBack = error_cb;
};

Worker.prototype = {

	setId: function(worker_id){
		this._id = worker_id;
	},

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
		if(!this.errorCallback) {
			this.errorCallback = function(error) {
				console.error(error);
				throw Error(error);
			};
		}

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
		} else {
			this.errorCallback('Job expired before run.', this);
		}
	},

	work: function(pre_run_cb, post_run_cb, error_cb){
		pre_run_cb(); //this is where the job should be dequeued;
		try{
			this._job.run(function(error){
				if(error){
					this._job.setState(this._job.STATES.FAILED);
					error_cb(error, this);
				}
				else {
					this._job.setState(this._job.STATES.FINISHED);
					post_run_cb(this);
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
