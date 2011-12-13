var JW= require('../job-rabbitmq').RabbitMQWorker;

var reg = new JW(
    // RabbitMQ configuration
    {
        queueName: "jobs2",
        queueOption: { autoDelete: true, durable: true, exclusive: false }
    });
reg.addRegistry('../registry/sampleReg.js');
reg.work();
