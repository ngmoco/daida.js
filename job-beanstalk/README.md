## About

RabbitMQ plugin for Job. 
So a task can be done in separate process.


## Installation

(not yet published)
> npm install job-rabbitmq

## Usage mode

enqueueing task

```
var Job = require('job').Job;
var RMQStore = require('job-rabbitmq').RabbitMQ;
scheduledTask = {
    taskName: "sample",
    runAt: "2011/11/11 00:38:00",
    task: function(){
      console.log('this is the task');
    },
    MQ: new RMQStore({})
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    task: function(){
      console.log('this is the task2');
    },
    MQ: new RMQStore({})
};
try {
    Job(scheduledTask);
    Job(scheduledTask2);
} catch (err) {
    console.error(err);
```

retrieving task from queue server and do dequeued task in separate process

```
var JW= require('./job-rabbitmq').RabbitMQWorker;
var reg = new JW();
// sampleReg.js file has what you want to do
reg.addRegistry('./registry/sampleReg.js');
reg.work();
```

## Reference
