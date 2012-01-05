/**
 * The Worker object
 * this is just a glorified job. It allows us the abstraction.
 */

var Worker = function Worker(job, pre_run_cb, post_run_cb, error_cb) {
	this._id = 0;
	this._job = job;
	this._allowedToWork = false;
	this._running = false;
	this.preRunCallback = pre_run_cb;
	this.postRunCallback = post_run_cb;
	this.errorCallBack = error_cb;
	this.numRetries = 0; //this is used by the supervisor to know how many times this worker has attempted to work
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

	setAllowedToWork: function(allowedToWork){
		this._allowedToWork = allowedToWork;
	},

	isAllowedToWork: function(){
		return this._allowedToWork;
	},

	setRunning: function(running){
		this._running = running;
	},

	isRunning: function(){
		return this._running;
	},

	setJob: function(job){
		this._job = job;
	},

	getJob: function(){
		return this._job;
	},

	run: function(){
		if(!this.errorCallback) {
			this.errorCallback = function(error) {
				console.error(error);
				throw Error(error);
			};
		}

		var timeout = new Date(this._job.runAt) - new Date();

		if (timeout >= 0) {
			this.startTimer(timeout);
		} else {
			this.errorCallback('Job expired before run.', this);
		}
	},

	startTimer: function(timeout){
		if(this._running)
			this.errorCallback('Already Running', this);

		this._running = true;

		this._job.setState(this._job.STATES.DELAYED);
		// start the timer.
		this._timeoutId = setTimeout(function(self){
			self.work(self.preRunCallback, self.postRunCallback, self.errorCallback); //this should be set by the scheduler via dependency injection setter style
		}, timeout, this);
	},

	work: function(){
		this.preRunCallback(this); //this is where the job should be dequeued and this._runnable should be set to true.
		if(this._allowedToWork){
			// If we are allowed to work the job has been dequeued and we should attempt
			// to run it.
			try{
				this._job.run(function(error){
					if(error){
						this._job.setState(this._job.STATES.FAILED);
						this.errorCallback(error, this);
					}
					else {
						this._job.setState(this._job.STATES.FINISHED);
						this.postRunCallback(this);
					}
				}.bind(this));
			} catch (err){
				this._job.setState(this._job.STATES.FAILED);
				this.errorCallback(err, this);
			}
		}
	},

	cancel: function(){
		//we can only cancel a job if it hasn't started
		if(this._job.getState >= this._job.STATES.RUNNING)
			return false;

		this._allowedToWork = false;
		clearTimeout(this._timeoutId);
		this._job.setState(this._job.STATES.STOPPED);
		this._running = false;
		return true;
	},
};

exports.Worker = Worker;
