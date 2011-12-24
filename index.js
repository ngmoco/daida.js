var fs = require('fs');
var path = require('path');

var exports = module.exports;

//include the scheduler

exports.Scheduler = require('./scheduler').Scheduler;

var STRATEGY_EXCLUSIONS = [];

function augmentAuthWithStrategy(filename, path) {
  if (!STRATEGY_EXCLUSIONS[filename] && filename[0] != '_') {
      var name = filename;
	  if(/\.js$/.test(filename))
		name = filename.substr(0, filename.lastIndexOf('.'));

	  var camelCaseName= name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
      Object.defineProperty(exports, camelCaseName, {
        get: function() {
          return require('./' + path+ '/' + name);
        },
        enumerable:true});
  }
}

// The following assumes that the strategies will either be in a file inside
// the strategies folder
// or in a subdirectory that follows the folders as modules guidelines.
// See: http://nodejs.org/docs/v0.6.6/api/modules.html#folders_as_Modules
//
// The files or subdirectories that are included should have the same filename as the name
// of the strategy they contain the functionality for. They should expose the strategies
// api through the module exports.
// NOTE: we only traverse 1 level down the directory tree.
// NOTE: the goal is to allow the strategies themselves to be held within their own repositories.
fs.readdirSync(__dirname + '/strategies').forEach(function(filename){
	if(fs.statSync(__dirname + '/strategies/' + filename).isDirectory()){ //check if it is a subdirectory
		var fullDirPath = __dirname + '/strategies/' + filename;
		//first check if an include is possible
		//the following looks for files in the directory indicating the dir follows the
		//guidlines for using directories as modules. See more: http://nodejs.org/docs/v0.6.6/api/modules.html#folders_as_Modules
		if(path.existsSync(fullDirPath + '/package.json') || path.existsSync(fullDirPath + '/index.js') || path.existsSync(fullDirPath + '/index.node')){
			augmentAuthWithStrategy(filename, '/strategies'); //include the folder as a module
		} else {
			console.log('Could not include file: ' + fullDirPath);
		}
	} else {
		augmentAuthWithStrategy(filename, '/strategies'); //if a file just include the file
	}
});
