/**
 * Local eventloop backed Queue and Worker strategy
 *
 */
var inject = exports.inject = function(context){
	var Local = {
		Queue : require('./queue').Queue,
		Supervisor : require('./supervisor').inject(context).Supervisor, //pass the context into a closure around Supervisor
		Worker : require('./worker').Worker,
		Job : require('./job').Job,
	};
	return Local;
};
var Local = inject();
exports.Queue = Local.Queue;
exports.Supervisor = Local.Supervisor;
exports.Worker = Local.Worker;
exports.Job = Local.Job;
