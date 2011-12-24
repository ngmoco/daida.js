var util = require('util');
function dump(taskObj){
  console.log(util.inspect(taskObj));
  console.log(taskObj.str);
}

function dump2(taskObj){
  console.log(util.inspect(taskObj));
  console.log(taskObj.str);
}
exports.dump = dump;
exports.dump2 = dump2;

