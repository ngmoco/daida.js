var RabbitMQQueue = require('../index').RabbitMQ.Queue;

var Scheduler = require('../index').Scheduler;

var rabbitMQQueue = new RabbitMQQueue({
	queueName: "jobscheduler",
	queueOption: {
		autoDelete: true,
		durable: true,
		exclusive: false
	}
});

var scheduler = new Scheduler(rabbitMQQueue);

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    taskName: "sample",
    runAt: "2011/11/21 23:17:00",
    taskFunc: "dump",
    taskArgObj: {str: 'test task1'},
};
var scheduledTask2 = {
    taskName: "sample",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "dump2",
    taskArgObj: {str: 'test task2'},
};
var scheduledTask3 = {
    //local task will be fired with setTimeout
    taskName: "localTask",
    runAfter: 2000, // msec, means this task will be fired after 10sec
    task: function(){ // can specify function directly in "task" property
      console.log('local task');
    }
};
var scheduledTask4 = {
    //local task will be fired with setTimeout
    taskName: "localTask2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    task: [function test(){ // can use array here.
        console.log('first local task');
      },
      function test2(){
        console.log('second local task');
      }
    ]
};


/**
 * enqueue tasks
 */

try {
    scheduler.schedule(scheduledTask);
    scheduler.schedule(scheduledTask2);
    scheduler.schedule(scheduledTask3);
    scheduler.schedule(scheduledTask4);
    scheduler.schedule({
        taskName: "local task test",
        runAfter: 2000,
        task: function(){
          console.log('inline');
        }
    });
} catch (err) {
    console.error(err);
}
