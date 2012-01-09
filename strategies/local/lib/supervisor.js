/**
 * The Supervisor object
 *
 * It allows you to start a bunch of workers and
 * hand them jobs and either start their timers immediately
 * a la runJob() below. OR you can allow for a bunch of jobs
 * to be added and then start all of their timers at once (see runAll() below)
 * OR you can allow for the supervisor to poll for new jobs being added and
 * start their timers as they come in (see runAllAndPoll below). The latter 2
 * are handy if you want to defer staring job's timers until a certain point
 * in time aka when the system is not under load.
 */

var Worker = require('./worker').Worker;

var inject = exports.inject = function(context){
	var Supervisor = function Supervisor(handler_registry_path, buffered, max_workers_in_buffer, max_workers_working, max_worker_retries, delay_in_secs_for_retry){
		this._handlerRegistryPath = handler_registry_path || '../../../handlers'; //defaults to the handlers folder in the module top level dir.
		this._workers = [];
		this._numWorkers = 0;//handle the possibility of sparse arrays
		this._numWorkersWorking = 0;
		this._runnable = false;
		this._buffered = buffered || false; //turns on the worker buffering.
		this.MAX_WORKERS_IN_BUFFER = max_workers_in_buffer || 0; //some arbitrary number for now. 0 = unlimited. TODO: make this a configuration variable
		this.MAX_WORKERS_WORKING = max_workers_working || 0; //the maximum number of concurrent WORKING workers (not just waiting for timer to fire). 0 indicates unlimited.
		this.MAX_WORKER_RETRIES = max_worker_retries || 1; //the maximum number of time to retry a worker working (if numWorkersWorking > MAX_WORKERS_WORKING a worker get's retried)
		this.DELAY_IN_SECS_FOR_RETRY = delay_in_secs_for_retry || 1; //the number of seconds to wait before retrying a workers work.
	};

	Supervisor.prototype = {
			supervise: function(job, pre_run_cb, post_run_cb, error_cb) {
			//We star by checking if the job's handler is actually
			//runnable. This avoids queuing jobs that won't work.

			//TODO we need to enforce that all tasks accept the call back of
			//workers "post run function" in the taskFunc call below
			//so that when the task is finished async or not it will pass controll
			//back to worker for post task cleanup
			var runnable;
			if(job.taskFunction){
				//the runnable was already on the task.
				runnable = job.taskFunction;
			}
			else {
				//insure trailling slash so that concatenation below works correctly.
				if('/' !== this._handlerRegistryPath.slice(this._handlerRegistryPath.length-1,this._handlerRegistryPath.length)){
						this._handlerRegistryPath += '/';
				}

				try {
					//here is where we inject the app context
					var runnableModule = require(this._handlerRegistryPath+job.handlerModule.toLowerCase());
					if(context && runnableModule.inject) //if this module supports context injection
						runnableModule = runnableModule.inject(context);

					runnable = runnableModule.handlers[job.handlerFunction];
				} catch(e) {
					//noOp
				}
			}
			//if we still don't have a runnable handler function let's gtfo
			if(!runnable) {
				error_cb('Invalid handler function', job);
				return;
			}
			job.setRunnable(runnable);

			if(this._buffered){
				if(this.MAX_WORKERS_IN_BUFFER > 0 && this._numWorkers >= this.MAX_WORKERS_IN_BUFFER) {
					error_cb('Job buffer full. Please try again later.', job);
					return false;
				}
				//if we are running in a buffered mode then just set up the job
				//and wait for the runAll or runAllAndPoll method to be called
				this.addJob(job, pre_run_cb, post_run_cb, error_cb);
				return true;
			} else {
				//otherwise let's just star the jobs timer immediately
				this.runJob(job, pre_run_cb, post_run_cb, error_cb);
				return true;
			}
		},

		addJob: function(job, pre_run_cb, post_run_cb, error_cb) {
			var worker = new Worker(job);
			worker.setPreRunCallback(this.workerStarting(pre_run_cb));
			worker.setPostRunCallback(this.workerDone(post_run_cb));
			worker.setErrorCallback(this.workerError(error_cb)); //pass in the closure creator result with job error cb
			//the following does not work as the id get's set too late. needs to
			//get set before it is pushed onto the queue
			worker.setId(this._workers.push(worker)-1); //this way the worker knows
			//where it is in the workers array
			this._numWorkers++;
			return worker;
		},

		// This is  way to start a job's timer
		// immediately. Bypassing any job buffering.
		// However the worker may still be denied from staring.
		// See the workerStarting callback function below for more info.
		runJob: function(job, pre_run_cb, post_run_cb, error_cb) {
			var worker = this.addJob(job, pre_run_cb, post_run_cb, error_cb);
			if(!worker.isRunning()) {
				worker.run(); //the workers timer will be started now.
			}
			return worker;
		},

		workerStarting: function(pre_run_cb) {
			return function(worker){
				// TODO: We should notify the scheduler of such a failure so that it puts the job into the error queue.
				if(this.MAX_WORKERS_WORKING > 0){
					if(this._numWorkersWorking >= this.MAX_WORKERS_WORKING){
						//if worker.cancel returns false it means the worker is allready working
						//so there is no way to cancel it. BUT we shouldn't start a new timer.
						if(worker.cancel()) {
							//check to make sure the worker hasn't exhausted it's retries
							if(worker.numRetries < this.MAX_WORKER_RETRIES) {
								worker.numRetries++;
								//reschedule worker to run after short delay
								worker.startTimer(this.DELAY_IN_SECS_FOR_RETRY*1000);
							} else {
								worker.errorCallback('Out Of Retries', worker);
							}
						}
						return;
					}
				}
				//the following only get's run if we can service the worker now
				//otherwise the worker's startTimer function will start the
				//process over again in 1 second if the worker has more retry
				//attempts. If the worker has exhausted its retry attempts we
				//have the worker call the error callback
				this._numWorkersWorking++;
				worker.setAllowedToWork(true); //for now all workers are allowed to work!
				pre_run_cb(worker.getJob()); //this is where the job will be dequeued by the scheduler.
				return;
			}.bind(this);
		},

		workerError: function(job_error_cb){
			return function(error, worker){
				this.workerDone(worker);
				job_error_cb(error, worker.getJob());
			}.bind(this);
		},

		workerDone: function(post_run_cb){
			return function(worker) {
				this._numWorkersWorking--;
				this._numWorkers--;

				//below we don't want to use splice since
				//it will re-shuffle the array.
				delete this._workers[worker._id];
				post_run_cb(worker.getJob());
			}.bind(this);
		},

		isWorkFinished: function(){
			return this._numWorkers === 0;
		},

		// Flags the supervisor to stop
		// polling for runnable workers
		stop: function(){
			this._runnable = false; //everything will stop on next trip around the event loop
			this.cancelAll();
		},

		cancelAll: function(){
			//now cancel all jobs.
			if(!this.isWorkFinished()){
				for(key in this._workers){
					var worker = this._workers[key];
					if(worker.isRunning())
						worker.cancel();
				}
			}
		},

		// Flags the supervisor to
		// allow for polling of runnable workers
		start: function() {
			this._runnable = true;
			this.runAllAndPoll();
		},

		runAll: function() {
			for(key in this._workers){
				var worker = this._workers[key];
				//this is where we can have a check for number of workers running threshold
				if(!worker.isRunning()){
					worker.run(); //the workers timer will be started now
				}
			}
		},

		// NOTE the following causes 100% cpu usage as the run function
		// will always be on the event loop.
		// This is really only good for when you want to be able to
		// control the flow of jobs (aka limit the number of workers)
		// in the future it can facilitate pre-empting workers as well
		// for instance if their jobs run to long we can cancel them
		// after a certain amount of wall time
		runAllAndPoll: function() {
			if(!this._runnable)
				return false; //stop has been called so let's break outa here.

			if(this.isWorkFinished()){
				process.nextTick(this.runAllAndPoll.bind(this));
			} else {
				this.runAll();
				process.nextTick(this.runAllAndPoll.bind(this));
			}
		},

	};
	return {Supervisor: Supervisor};
};
exports.Supervisor = inject().Supervisor;
