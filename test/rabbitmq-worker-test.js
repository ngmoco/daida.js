var RabbitMQWorker = require('../index').RabbitMQ.Worker;

var rabbitMQWorker = new RabbitMQWorker(
    // RabbitMQ configuration
    {
        queueName: "jobs",
        queueOption: { autoDelete: true, durable: true, exclusive: false }
    });
rabbitMQWorker.addRegistry('../../../handlers/sampleReg.js'); //this is relative to the location of the RabbitMQWorker file above (see JW require)
rabbitMQWorker.work();
