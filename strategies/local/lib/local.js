/**
 * Local eventloop backed Queue and Worker strategy
 *
 */

var Queue = exports.Queue = require('./queue').Queue;
var Supervisor = exports.Supervisor = require('./supervisor').Supervisor;
var Worker = exports.Worker = require('./worker').Worker;
var Job = exports.Job = require('./job').Job;
