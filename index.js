const config = require('./config');
const events = require('./src/events');
const taskLib = require('./task.js');
const chalk = require('chalk');
const fs = require('fs');
require("console-stamp")(console, {
  pattern: 'HH:MM:ss:l',
  label: false,
  colors: {
    stamp: require('chalk').white
  }
});
var mod = require(`./src/monitor`).init
console.log(chalk.red('-------------------------'));
console.log(chalk.cyan('   Shopify Monitor V1'));
console.log(chalk.cyan('        By Rock'));
console.log(chalk.red('-------------------------'));
console.log(chalk.magenta(`Found ${config.sites.length} sites.`));
console.log(chalk.magenta(`Found ${fs.readFileSync(__dirname + '/proxies.txt').toString().split("\n").length} proxies.`));
console.log(chalk.red('-------------------------'));
console.log(chalk.cyan('Initializing (' + config.sites.length + ') sites.'));
console.log(chalk.red('-------------------------'));
config.sites.forEach(function (site) {
  try {
      startmod = new mod(site);
  } catch (e) {

  }

});
/*setTimeout(function() {
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
}*/

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
