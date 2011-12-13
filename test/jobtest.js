var Job = require('../job').Job;
var RMQStore = require('../job-rabbitmq').RabbitMQ;

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    taskName: "sample",
    runAt: "2011/11/21 23:17:00",
    taskFunc: "dump",
    taskArgObj: {str: 'test task1'},
    MQ: new RMQStore(
        // RabbitMQ configuration
        // { host: 'localhost'
        // , port: 5672
        // , login: 'guest'
        // , password: 'guest'
        // , vhost: '/'
        // }
        // or, can use URL
        // {
        // url: amqp[s]://[user:password@]hostname[:port][/vhost]
        // }
        {
          queueName: "bar",
          queueOption: { autoDelete: true, durable: true, exclusive: false }
        }
    )
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "dump2",
    taskArgObj: {str: 'test task2'},
    // if you have MessageQueue Store, specify that like this.
    MQ: new RMQStore(
        // RabbitMQ configuration
        {
          queueName: "jobs2"
        }
    )
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
 * enque tasks
 */

try {
    Job(scheduledTask);
    Job(scheduledTask2);
    Job(scheduledTask3);
    Job(scheduledTask4);
    Job({
        taskName: "local task test",
        runAfter: 2000,
        task: function(){
          console.log('inline');
        }
    });
} catch (err) {
    console.error(err);
}
