var fs = require('fs');

process.stdout.write("================================================================================\n");
process.stdout.write("=                                                                              =\n");
process.stdout.write("=                     Daida.js installing default strategies                   =\n");
process.stdout.write("=                                                                              =\n");
process.stdout.write("================================================================================\n");

//Symlink default strategies
var npm_pkg_conf_env_var_prefix = 'npm_package_config'; //see: http://npmjs.org/doc/json.html#config
var modules_path_rel_to_strategies = '../node_modules';
var strategies_path_rel_to_this_script = './strategies';

//ahh what I would give for list comprehensions here
for(var key in process.env){
	//we are looking for keys that look like
	//npm_package_config_strategies_local
	if(key.indexOf(npm_pkg_conf_env_var_prefix+'_strategies_') >= 0){
		var strategy_name = key.replace(npm_pkg_conf_env_var_prefix+'_strategies_', '');
		var strategy_module_name = process.env[key];
		fs.symlinkSync(modules_path_rel_to_strategies+'/'+strategy_module_name, strategies_path_rel_to_this_script+'/'+strategy_name, 'dir');
		process.stdout.write("Daida.js Install: Symlinked the "+strategy_name+" strategy.\n")
	}
}
process.stdout.write("Daida.js Install: Finished.\n")
