var fs = require('fs');

//Symlink default strategies
fs.writeSync(fs.openSync('./npm_output_test','a'), JSON.stringify(npm_package_dependencies));
fs.symlinkSync('../node_modules/daida-local', './strategies/local', 'dir');
fs.symlinkSync('../node_modules/daida-beanstalk', './strategies/beanstalk', 'dir');
