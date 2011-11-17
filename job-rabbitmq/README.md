## About

RabbitMQ plugin for job. 

## Installation

(not yet published)
> npm install job-rabbitmq

## Usage mode

```javascript
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

## Reference
