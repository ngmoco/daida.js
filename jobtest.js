var Job = require('./job').Job;
var RMQStore = require('./job-rabbitmq').RabbitMQ;

scheduledTask = {
    taskName: "sample",
    runAt: "2011/11/11 00:38:00",
    taskFunc: "dump",
    taskArgObj: {str: 'testtask1'},
    /*
    task: function(){
      console.log('this is the task');
    },
    */
    MQ: new RMQStore({}),
    debug: true
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "dump2",
    taskArgObj: {str: 'testtask2'},
    MQ: new RMQStore({}),
    debug: true
};
var scheduledTask3 = {
    //local
    taskName: "localTask",
    runAfter: 2000, // msec, means this task will be fired after 10sec
    task: function(){
      console.log('this is the task');
    },
    debug: true
};

try {
    Job(scheduledTask);
    Job(scheduledTask2);
    Job(scheduledTask3);
} catch (err) {
    console.error(err);
}
