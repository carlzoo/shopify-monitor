const config = require('./config');
const events = require('./src/events');
const taskLib = require('./task.js');
const chalk = require('chalk');
require("console-stamp")(console, {
  pattern: 'HH:MM:ss:l',
  label: false,
  colors: {
    stamp: require('chalk').magenta
  }
});

var taskArr = [];

console.log('Monitor Started');

config.sites.forEach(function (site) {
  taskArr.push(site)
});
setTimeout(function() {
  init();
}, 500);

function init() {
  console.log(chalk.green('Starting Tasks...'));

  taskArr.map(function(task, i) {

          taskLib.start(task, (err, response) => {
              if (err) {
                  console.log(chalk.redBright.red(err));
                  return process.exit(1);
              }
          });
  });
}

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
