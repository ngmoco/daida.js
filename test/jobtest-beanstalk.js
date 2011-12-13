var Job = require('../job').Job;
var BeanstalkClient = require('../job-beanstalk').Client;

/**
 *  Declaring Task Object
 */
var scheduledTask = {
    taskName: "sample",
    runAt: "2011/12/13 13:53:00",
    taskFunc: "test",
    taskArgObj: {str: 'test task1'},
    MQ: new BeanstalkClient(
        // Beanstalk configuration
        // { host: 'localhost'
        // , port: '11300'
        // , queueName: "bar";
        // }
        {
          queueName: "jobscheduler",
        }
    )
};
var scheduledTask2 = {
    taskName: "sample2",
    runAfter: 3000, // msec, means this task will be fired after 10sec
    taskFunc: "foo",
    taskArgObj: {str: 'test task2'},
    // if you have MessageQueue Store, specify that like this.
    MQ: new BeanstalkClient(
        {
          host: 'localhost',
          port: '11300',
          queueName: "jobscheduler"
        }
    )
};


/**
 * enque tasks
 */

try {
    Job(scheduledTask);
    Job(scheduledTask2);
} catch (err) {
    console.error(err);
}
