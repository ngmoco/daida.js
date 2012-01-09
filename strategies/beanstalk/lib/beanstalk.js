/**
 * The beanstalkd based queue and worker strategy
 *
 */

//The following high order function allows the Beanstalk module to accept
//a context object that will be passed on through to the worker and ultimately
//to the handler that the worker runs when the job's timer fires. This pattern
//allows for the context to be added at runtime. Things like application
//configurations and other "global" variables can be put into scope of the
//handler function in this manner.
var inject = exports.inject = function(context){
	var Beanstalk = {
		Queue : require('./queue').Queue,
		Worker : require('./worker').inject(context).Worker, //this passes the injected arguments on through
	};
	return Beanstalk;
};
var Beanstalk = inject();
exports.Queue = Beanstalk.Queue;
exports.Worker = Beanstalk.Worker;
