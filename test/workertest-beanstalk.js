
var options = {
  workers: 3,
  server: '127.0.0.1:11300',
  tubes: ['jobscheduler'],
  ignore_default: true,
  handlers: ['../../registry/test', ]
};

var Worker = require('./job-beanstalk').Worker;

var worker1 = new Worker(options);
worker1.work(); //aka worker1.start();

/*var JW= require('./job-rabbitmq').RabbitMQWorker;

var reg = new JW(
    // RabbitMQ configuration
    {
        queueName: "jobs2",
        queueOption: { autoDelete: true, durable: true, exclusive: false }
    });
reg.addRegistry('./registry/sampleReg.js');
reg.work();*/
