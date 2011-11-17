var fs = require('fs');

//var taskFile = fs.realpathSync('./registry/sampleReg.js');
var JW= require('./job-rabbitmq').RabbitMQWorker;


var reg = new JW();
//reg.inspectReg('./registry/sampleReg.js');
reg.addRegistry('./registry/sampleReg.js');
reg.work();
