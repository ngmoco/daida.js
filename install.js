var fs = require('fs');

//Symlink default strategies
console.log(require('util').inspect(npm_package_dependencies));
fs.symlinkSync('../node_modules/daida-local', './strategies/local', 'dir');
fs.symlinkSync('../node_modules/daida-beanstalk', './strategies/beanstalk', 'dir');
