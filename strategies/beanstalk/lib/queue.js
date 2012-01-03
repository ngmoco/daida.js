/**
 * The Queue object
 * @param {config} The beanstalk server configuration object:
 * {
 *     host: 'localhost'
 *   , port: 11300
 *   , queueName: 'test'
 * }
 */

var util = require('util');
var BeanstalkClient = require('beanstalk_client').Client;

var Queue = function(){

    this.config = arguments[0] || {};

    //Some sensible defaults. TODO: put queueName magic string default in a config file somwhere
    this.host = this.config.host || 'localhost';
    this.port = this.config.port || '11300';
    this.queueName = this.config.queueName || 'jobscheduler';

};

Queue.prototype = {
  // queue() is exposed to JobScheduler
  queue: function(taskObj, cb){

    var callback = cb || function(err, job_id){ if(err) console.error(util.inspect(err)); /*noOp*/ }; //allow for optional callback passing

    //hall ass out of here if we don't have a taskObj
    if(!taskObj){
        var error = new Error('You must pass a task to queue.');
        callback(error, null);
        throw error;
    }

    var connection;
    var qname = this.queueName;

    var delay = taskObj.runAfter || 0;
    if(taskObj.runAt){
        delay = new Date(taskObj.runAt) - new Date(); //arbitrarily choosing runAt to trump runAfter
    }

    delay = delay/1000; //change from milliseconds to seconds for beanstalkd

    delay = Math.floor(delay); //Round down for whole integer

    //We can't schedule into the past!
    if(delay < 0)
        delay = 0;

    var data = taskObj.args;
    var type = taskObj.handlerModule + '.' + taskObj.handlerFunction;
    var job_data = {'type': type, 'data': data}; //this is the message format that node_beanstalk_worker likes.

    BeanstalkClient.connect(this.host+':'+this.port, function(error, connection){
        if(error){
            callback(error, null);
            throw error;
        }

        connection.use(qname, function(){
            //we are not exposing the priority now.
            //TODO: allow for Beanstalk message priority to
            //be exposed via the taskObj
            //
            //we are not exposing the message TTL now.
            //TODO: allow for the message TTL to be passed
            //via the taskObj
            connection.put(0, delay, 1, JSON.stringify(job_data), function(error, job_id){
                //start by closing the socket
                connection.end();

                if(error){
                    callback(error, null);
                    throw error;
                }

                callback(null, job_id);
            });
        });
    });
  }
};

exports.Queue = Queue;
