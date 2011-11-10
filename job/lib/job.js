/**
 * Scheduler for batch running a controlled amount of tasks per interval
 */

var util = require('util');

/**
 * return text with given color
 */
function colorize(str, color){
    var colorpalette = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37 };
    return '\x1B[' + colorpalette[color] + 'm' + str + '\x1B[0m';
}

/**
 * dump utility
 */
function dump(obj, color){
  if(color){
    console.info(colorize(util.inspect(obj, true, null), color));
  } else {
    console.info(util.inspect(obj, true, null));
  }
}


// JobScheduler constructor
function JobScheduler(taskObj){
  var util = require('util');
  // task queue
  this._jobqueue = [];
  this.runAt = taskObj.runAt;
  this.addTask(taskObj.task);
  this.start();
  taskObj.attempts = taskObj.max_attempts;
}

JobScheduler.prototype = {
  addTask: function(task){
    if(typeof task !== 'function'){
      console.error('Specified Task is not function');
    }
    this._jobqueue.push(task);
  },
  // do tasks
  doTask: function(){
    try {
      for( var i = (this._jobqueue.length - 1); i >= 0; i--){
          this._jobqueue[i].call(this);
      }
    } catch(err) {
      dump("grr", "white");
    }
    // some logging system needed if it's finished properly

  },
  // starting job.
  start: function(){
    if(this.running) return;
    // now() + max_runtime
    var timeout = new Date(this.runAt) - new Date();
    this.call = 0;
    if (timeout >= 0) {
      this.running = true;

      // if we don't use setTimeout, nextTick would be help.
      this._timeoutId = setTimeout(function(self){
        self.running = false;
        self.doTask();
      }, timeout, this);
    } else {
      this.running = false;
      console.error("too late to do it.");
    }
  },
  stop: function(){
    clearTimeout(this._timeoutId);
  }
};

/**
 * JobHandler
 * taskObj Data Schema
 * taskObj = {
 *  runAt: "2011/11/10 09:00:00" // datetime, any string can be recognized as an argument of Date()
 *  task: function(){} // needs to be function object
 *  argumentObj: {} // anything you want to set
 *  priority: 10 // default 0, higer number has more priority
 * };
 */

var Job = function(taskObj){

  // max attempts
  var max_attempts = 10;

  if(! taskObj.attempts) taskObj.attempts = 0;
  if(! taskObj.max_attempts) taskObj.max_attempts = max_attempts;

  // if runAfter param exists
  if(taskObj.runAfter) {
    if(typeof taskObj.runAfter !== 'number'){

      dump(taskObj.taskName + ': Specified runAfter must be number', "white");
      return;
    }
    taskObj.runAt = new Date(new Date().getTime() + taskObj.runAfter);
  }

  console.info('Job name:        ' + taskObj.taskName );
  console.info('job will run at: ' + taskObj.runAt );

  for( taskObj.attempts = 0; taskObj.attempts < max_attempts; taskObj.attempts++){
    try {
      // some logic to watch the task's runtime
      new JobScheduler(taskObj);
    } catch(err) {
      dump("An error occured", "red");
      taskObj.attempts -= 1;
      i--;
      // reschedule task till max_attempts;
      new JobScheduler(err, taskObj);
    }
  }
}

// TODO

// separate producer/consumer
// lock the job
// unlock the job
// report failed job
// parallel job
// serial job
// connect to job queue server
// retrieve jobs random
// unlock all by this worker
// show status
// workers sleep if there are no jobs
// watch runtime ( can we stop processing task? )

exports.Job = Job;
