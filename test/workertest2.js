var JW= require('../strategies/rabbitmq').RabbitMQWorker;

var reg = new JW(
    // RabbitMQ configuration
    {
        queueName: "jobs2",
        queueOption: { autoDelete: true, durable: true, exclusive: false }
    });
reg.addRegistry('../../../registry/sampleReg.js'); //this has to be relative to the location of the RabbitMQWorker file above (see JW require)
reg.work();
