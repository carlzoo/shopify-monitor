const config = require('./config');
const events = require('./src/events');
require("console-stamp")(console, {
  pattern: 'HH:MM:ss:l',
  label: false,
  colors: {
    stamp: require('chalk').magenta
  }
});

console.log('Monitor Started');

config.sites.forEach(function (site) {
  require(`./src/monitor.js`)(site)
});

events.on('newitem', (data) => {
  for (var i = 0; i < config.webhook.length; i++) {
    require('./src/webhook.js').send(config.webhook[i], data.url, 'newitem')
  }
});

events.on('restock', (data) => {
  console.log(data);
  for (var i = 0; i < config.webhook.length; i++) {
    require('./src/webhook').send(config.webhook[i], data.url, 'restock')
  }
});
