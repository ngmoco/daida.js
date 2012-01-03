var BeanstalkWorker = require('beanstalk_worker').BeanstalkWorker;

/**
 * Worker Process constructor
 */
var Worker = function() {
    /* options = {
     *  server: '127.0.0.1:11300',
        tubes: ['test'],
        ignore_default: true,
        handlers: ['../handlers/test', '../handlers/http_request']
       };
    */
	//TODO put the following defaults into a config file
	this.options = arguments[0] || {};
    this.server = this.options.server || '127.0.0.1:11300';
    this.tubes = this.options.tubes || ['jobscheduler'];
    this.ignore_default = this.options.ignore_default || true;

    this.handlers = [];
    for(var i=0; i< this.options.handlers.length; i++) {
        var currentHandlerNamespace = require(this.options.handlers[i]);
		var namespaceName = currentHandlerNamespace.handlerNamespace;
		var handlersWithNSPrefix = [];
		for( var key in currentHandlerNamespace.handlers ) {
			if( currentHandlerNamespace.hasOwnProperty(key)) {
				var handlerNameWithNSPrefix = namespaceName + '.' + key;
				console.log(handlerNameWithNSPrefix);
				handlersWithNSPrefix[handlerNameWithNSPrefix] = currentHandlerNamespace.handlers[key];
			}
		}
		this.handlers.push(handlersWithNSPrefix); //require from filesystem and put in registry
    }

	//TODO: put the following scalar into a configuration file
    var workerId = Math.floor(Math.random()*10000); //It's doubtful we will have more than 1000 workers.
    this._worker = new BeanstalkWorker(workerId, this.server, this.handlers);

}

/**
 * Worker
 */
Worker.prototype.start = function(){
    this._worker.start(this.tubes, this.ignore_default);
};
//synonym
Worker.prototype.work = Worker.prototype.start;

Worker.prototype.stop = function(){
    this._worker.stop();
};

exports.Worker = Worker;
