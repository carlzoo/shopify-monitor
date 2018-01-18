const service = require('./src/monitor');

exports.start = function(data, callback) {
  if (data.startsWith("http") || data.startsWith("https")) {
    service.init(data);
    console.log('Initialized: ' + data);
  } else {
    service.init("https://" + data);
    console.log('Initialized: ' + data);
  }
  return callback(null, true);
}
