/**
 * Worker Process constructor
 */
function Worker() {
    this.config = arguments[0] || {};
    this.registry = [];
}


Worker.prototype.addRegistry = function(file) {
    var fs = require('fs');
    rpath = fs.realpathSync(file);
    this.registry = require(rpath);
    return;
};

/**
 * for registry testing purpose
 */
Worker.prototype.invoke = function(str, arg){
    if(this.registry[str]) {
        this.registry[str](arg);
    } else {
        console.error('no such method');
    }
};

Worker.prototype.work = function(config){
    var dic = this.registry;
    var connection;

    // Default topic name
    var qname = "jobscheduler";
    if(this.config.queueName){
      qname = this.config.queueName;
    }
    var qoption = {
        autoDelete: true,
        durable: true,
        exclusive: false,
        passive: false
    };
    if(this.config.queueOption){
      qoption = this.config.queueOption;
    }
    try{
      connection = amqp.createConnection(this.config);
    } catch (e) {
      console.error(util.inspect(e));
    }
    connection.on('ready', function(){
        // specified queue name
        var q = connection.queue(qname, qoption);
        //q.bind('#');

        // yes
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

exports.Worker = Worker;
