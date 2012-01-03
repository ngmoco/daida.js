var Worker = require('./worker').Worker;

var Supervisor = function Supervisor(){
	this._workers = [];
	this.numWorkers = 0;//handle the possibility of sparse arrays
	this._runnable = false;
};

Supervisor.prototype = {
	addJob: function(job, pre_run_cb, error_cb) {
		var worker = new Worker(job);
		worker.setPreRunCallback(pre_run_cb);
		worker.setPostRunCallback(this.workerDone.bind(this));
		worker.setErrorCallback(this.workerError(error_cb)); //pass in the closure creator result with job error cb
		//the following does not work as the id get's set too late. needs to
		//get set before it is pushed onto the queue
		worker.setId(this._workers.push(worker)-1); //this way the worker knows
		//where it is in the workers array
		this.numWorkers++;
	},

	workerError: function(job_error_cb){
		return function(error, worker){
			this.workerDone(worker);
			job_error_cb(error, worker._job);
		}.bind(this);
	},

	workerDone: function(worker){
		//this is where we could handle any errors thrown by the job.
		//like putting it into a failed queue of some sort
		this.numWorkers--;
		delete this._workers[worker._id]; //we don't want to use splice since
		//it will re-shuffle the array.
	},

	isWorkFinished: function(){
		return this.numWorkers === 0;
	},

	stop: function(){
		this._runnable = false; //everything will stop on next trip around the event loop
	},

	start: function() {
		this._runnable = true;
		this.run();
	},

	run: function() {
		if(!this._runnable)
			return true; //stop has been called so let's break outa here.

		if(this.isWorkFinished()){
			process.nextTick(this.run.bind(this));
		} else {
			for(key in this._workers){
				var worker = this._workers[key];
				if(!worker.isRunning)
					worker.run();
			}
			process.nextTick(this.run.bind(this));
		}
	}
};

exports.Supervisor = Supervisor;
