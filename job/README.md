## About

Simple job scheduler for node.js. 

## Installation

(not yet published)
> npm install job

## Usage mode

```javascript
var Job = require('./job').Job;

scheduledTask = {
    taskName: "sample",
    runAt: "2011/11/11 00:38:00",
    task: function(){
      console.log('this is the task');
    }
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 3sec
    task: function(){
      console.log('this is the task2');
    }
};

try {
    Job(scheduledTask);
    Job(scheduledTask2);
} catch (err) {
    console.error(err);
}


```

## Reference
