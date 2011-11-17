/**
 * Job - AMQP plugin
 *
 */

var util = require('util');
var amqp = require('amqp');

/**
 * return text with given color
 */
/*
function colorize(str, color){
    var colorpalette = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37 };
    return '\x1B[' + colorpalette[color] + 'm' + str + '\x1B[0m';
}
*/
/**
 * dump utility
 */
/*
function dump(obj, color){
  if(color){
    console.info(colorize(util.inspect(obj, true, null), color));
  } else {
    console.info(util.inspect(obj, true, null));
  }
}
*/



/**
 * Constructor
 * Receive server configulation
 */

var RabbitMQ = function(config){

  /**
   * RabbitMQ Connection Option
   * { host: 'localhost'
   * , port: 5672
   * , login: 'guest'
   * , password: 'guest'
   * , vhost: '/'
   * , queueName: 'myqueue'
   * }
   */
  this.config = config;
};

RabbitMQ.prototype = {
  // queue() is exposed to JobScheduler 
  queue: function(taskObj){
    // if it exists
    delete taskObj.MQ;

    var qname = "jobscheduler";
    if(this.config.queueName){
      qname = this.config.queueName;
    }
    /*
    dump('Registering ' + taskObj.taskName + ' on RabbitMQ', 'cyan');
    dump('Registering ' + qname + ' as queue', 'cyan');
    dump('Registering ' + JSON.stringify(taskObj) + ' on RabbitMQ', 'cyan');
    */
    //var f = { g: JSON.stringify(taskObj)};
    var f = taskObj;

    var connection = amqp.createConnection(this.config);
    connection.addListener('error', function (e) {
      throw e;
    });

    connection.on('ready', function(){
      // connection.exchange('my-exchange', { type: 'topic' }); 
      // Options 
      // - type 'fanout', 'direct', or 'topic' (default) 
      // - passive (boolean) 
      // - durable (boolean) 
      // - autoDelete (boolean, default true) 
      var ex = connection.exchange();

      // Options
      // - passive (boolean)
      // - durable (boolean)
      // - exclusive (boolean)
      // - autoDelete (boolean, default true)
      var queue = connection.queue('jobscheduler', { autoDelete: true, durable: true, exclusive: false });

      // exchange.publish('routing.key', 'body');
      //
      // the third argument can specify additional options
      // - mandatory (boolean, default false)
      // - immediate (boolean, default false)
      // - contentType (default 'application/octet-stream')
      // - contentEncoding
      // - headers
      // - deliveryMode
      // - priority (0-9)
      // - correlationId
      // - replyTo
      // - experation
      // - messageId
      // - timestamp
      // - userId
      // - appId
      // - clusterId
      ex.publish('jobscheduler', f );

      // pretty ugly, but there is no way to avoid this at the moment
      setTimeout(function(){connection.end();}, 1000);
    });
  }
};

exports.RabbitMQ = RabbitMQ;

/**
 * Worker Process constructor
 */
function RabbitMQWorker() {
    this.registry = [];
}


RabbitMQWorker.prototype.addRegistry = function(file) {
    var fs = require('fs');
    rpath = fs.realpathSync(file);
    this.registry = require(rpath);
    return;
};

/**
 * for registry testing purpose
 */
RabbitMQWorker.prototype.invoke = function(str, arg){
    if(this.registry[str]) {
        this.registry[str](arg);
    } else {
        console.error('no such method');
    }
};

/**
 * let worker work
 */
RabbitMQWorker.prototype.work = function(config){
    var dic = this.registry;
    var connection = amqp.createConnection({});
    connection.on('ready', function(){
        var q = connection.queue('jobscheduler', 
          { autoDelete: true, durable: true, exclusive: false });
        q.bind('#');

        q.subscribe(function(taskObj){
            if(dic[taskObj.taskFunc]) {
                if(taskObj.runAfter) {
                    taskObj.runAt = new Date(new Date().getTime() + taskObj.runAfter);
                }
                var timeout = new Date(taskObj.runAt) - new Date();
                this._timeoutId = setTimeout(function(self){
                  dic[taskObj.taskFunc](taskObj.taskArgObj);
                }, timeout);
            } else {
                console.error('no such method');
            }
        });
    });
};

exports.RabbitMQWorker = RabbitMQWorker;
