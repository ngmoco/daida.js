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
    if (typeof obj === 'string'){
      console.info(colorize(obj, color));
    } else {
      console.info(colorize(util.inspect(obj, true, null), color));
    }
  } else {
    if (typeof obj === 'string'){
      console.info(obj);
    } else {
      console.info(util.inspect(obj, true, null));
    }
  }
}


// JobScheduler constructor
function JobScheduler(taskObj){
  // task queue
  this._jobqueue = [];
  // if task has MQ field, use MQ.queue() for queueing
  if(taskObj.MQ){
    //MQ plugin must support queue API
    taskObj.MQ.queue(taskObj);
  } else {
    this.runAt = taskObj.runAt;
    this.addTask(taskObj.task);
    this.start();
  }
  taskObj.attempts = taskObj.max_attempts;
}

JobScheduler.prototype = {
  // can add multiple tasks but not used now.
  addTask: function(task){
    if(task instanceof Array){
      for( var i = 0; i < task.length; i++){
        this._jobqueue.push(task[i]);
      }
    } else if(typeof task !== 'function'){
      console.error('Specified Task is not function');
    } else {
      this._jobqueue.push(task);
    }
  },
  // do tasks
  doTask: function(){
    try {
      for(var i = 0; i < this._jobqueue.length; i++){
          this._jobqueue[i].call(this);
      }
    } catch(err) {
      this.stop();
      dump("An Error Occured", "red");
      dump(err, "red");
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

var Job = function(taskObj){
  // debug purpose only
  var debug = true;

  if (! taskObj){
    throw "task Object not specified. ";
  }

  // max attempts
  var default_max_attempts = 10;

  if(! taskObj.attempts) taskObj.attempts = 0;
  if(! taskObj.max_attempts) taskObj.max_attempts = default_max_attempts;

  // if runAfter param exists
  if(taskObj.runAfter) {
    if(typeof taskObj.runAfter !== 'number'){
      dump(taskObj.taskName + ': Specified runAfter must be number', "white");
      return;
    }
    taskObj.runAt = new Date(new Date().getTime() + taskObj.runAfter);
  }

  if(debug){
    dump('Job name:        ' + taskObj.taskName, 'green');
    dump('job will run at: ' + taskObj.runAt, 'green' );
  }

  for( taskObj.attempts = 0; taskObj.attempts < taskObj.max_attempts; taskObj.attempts++){
    try {
      // some logic to watch the task's runtime
      new JobScheduler(taskObj);
    } catch(err) {
      dump("An error occured", "red");
      dump(err, "cyan");
      taskObj.attempts -= 1;
      i--;
      // reschedule task till max_attempts;
      new JobScheduler(err, taskObj);
    }
  }
};

exports.Job = Job;
