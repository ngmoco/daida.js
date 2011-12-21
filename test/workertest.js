var JW= require('../strategies/rabbitmq').RabbitMQWorker;

var reg = new JW(
    // RabbitMQ configuration
    {
        queueName: "jobs",
        queueOption: { autoDelete: true, durable: true, exclusive: false }
    });
reg.addRegistry('../../../registry/sampleReg.js'); //this is relative to the location of the RabbitMQWorker file above (see JW require)
reg.work();
