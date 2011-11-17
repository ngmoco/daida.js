var JW= require('./job-rabbitmq').RabbitMQWorker;

var reg = new JW();
reg.addRegistry('./registry/sampleReg.js');
reg.work();
