/**
 * The Worker object
 * @param {options} The beanstalkd server config and handlers
 */

var BeanstalkWorker = require('beanstalk_worker').BeanstalkWorker;
//the context param is the arguments array from the Beanstalk parent modules
//constuctor. It can be use to inject local variables into the
//workers below.
var inject = exports.inject = function(context) {
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
			var modulePath = this.options.handlers[i];
			var moduleName = modulePath;
			if(modulePath.indexOf('/') >= 0) {
				var modulePathParts = modulePath.split('/');
				moduleName = modulePathParts[modulePathParts.length-1];
			}
			var currentHandlerModule = require(modulePath);
			if(context && currentHandlerModule.hasOwnProperty('inject')) //check to see if this handler module accepts context injection
				currentHandlerModule = currentHandlerModule.inject(context);

			var currentHandlerModuleName = moduleName.charAt(0).toUpperCase() + moduleName.substr(1).toLowerCase();

			var handlersWithModulePrefix = [];
			for( var key in currentHandlerModule.handlers ) {
				if( currentHandlerModule.handlers.hasOwnProperty(key)) {
					var handlerNameWithModulePrefix = currentHandlerModuleName + '.' + key;
					handlersWithModulePrefix[handlerNameWithModulePrefix] = currentHandlerModule.handlers[key];
				}
			}
			this.handlers.push(handlersWithModulePrefix); //require from filesystem and put in registry
	    }

		//TODO: put the following scalar into a configuration file
	    var workerId = Math.floor(Math.random()*10000); //It's doubtful we will have more than 1000 workers.
	    this._worker = new BeanstalkWorker(workerId, this.server, this.handlers);

	};

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

	return { Worker: Worker };
}

exports.Worker = inject().Worker;
