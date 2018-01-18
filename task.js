const service = require('./src/monitor');

exports.start = function(data, callback) {
  if (data.startsWith("http") || data.startsWith("https")) {
    new (service.init(data))
    console.log('Initialized: ' + data);
  } else {
    new (service.init('https://' + data))
    console.log('Initialized: ' + data);
  }
  return callback(null, true);
}
