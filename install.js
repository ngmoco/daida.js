var fs = require('fs');

process.stdout.write("================================================================================\n");
process.stdout.write("=                                                                              =\n");
process.stdout.write("=               Daida.js Creating symlinks for default strategies              =\n");
process.stdout.write("=                                                                              =\n");
process.stdout.write("================================================================================\n");

//Symlink default strategies
process.stdout.write(JSON.stringify(npm_package_dependencies));
fs.symlinkSync('../node_modules/daida-local', './strategies/local', 'dir');
fs.symlinkSync('../node_modules/daida-beanstalk', './strategies/beanstalk', 'dir');
