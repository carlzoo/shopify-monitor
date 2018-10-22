const config = require('../config');
const request = require('request-promise');
const _ = require('underscore');
const chalk = require('chalk');
const cheerio = require('cheerio');
const events = require('./events');

class init {
  constructor(site) {
      var lastone = '';
      var cycle = 0;
      var original = [];
      var newprod = [];
      var proxylist = [];
      var fs = require('fs');
      var array = fs.readFileSync(__dirname + '/../proxies.txt').toString().split("\n");
      for (var i in array) {
        if (array[i] === '') {

        } else {
          proxylist.push(array[i])
        }
      }

      function getproxy() {
        if (proxylist.length == 0) {
          var proxy = 'http://localhost'
          return proxy;
        } else {
          var ogprox = proxylist[Math.floor(Math.random() * proxylist.length)]
          if (ogprox.split(':')[2] == undefined) {
            var proxy = `http://${ogprox.split(':')[0]}:${ogprox.split(':')[1]}`
            return proxy;
          } else {
            var proxy = `http://${ogprox.split(':')[2]}:${ogprox.split(':')[3]}@${ogprox.split(':')[0]}:${ogprox.split(':')[1]}`
            return proxy;
          }
        }
        //console.log(proxy);
      }

      function diff(one, two) {
        return _.reject(one, _.partial(_.findWhere, two, _));
      }
      //console.log(site);
      //console.log(diff(one, two));
      initialize()
      function initialize() {
        //console.log('yo ' + site);
        var prox = getproxy()
        var mainurl;
        if (site.startsWith('http') == true) {
          if (site.endsWith('/') == true) {
            mainurl = `${site}sitemap_products_1.xml`
          } else {
            mainurl = `${site}/sitemap_products_1.xml`
          }
        } else {
          if (site.endsWith('/') == true) {
            mainurl = `https://${site}sitemap_products_1.xml`
          } else {
            mainurl = `https://${site}/sitemap_products_1.xml`
          }
        }
        const opts = {
          method: 'GET',
          uri: mainurl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
          },
          gzip: true,
          proxy: getproxy(),
          json: true,
          simple: false
        }
        request(opts)
          .then(function(data) {
          //console.log(data);
         //console.log(`Cycle - ${cycle}`);
            if (cycle == 0) {
              console.log(chalk.green('Initialized - ' + site));
            }
            if (data.toString().indexOf("Try again in a couple minutes") != -1) {
              console.log(chalk.red('You are banned try again later. - ' + site));
              //console.log(data);
            } else {
              //console.log(cycle);
              var $ = cheerio.load(data);
              if (cycle == 0) {
                var arr = original;
                //console.log('og');
              } else {
                var arr = newprod;
                //console.log('newprod');
              }
                $('urlset url').each(function() {
                  var lastmod = $(this).children('lastmod').text()
                  var url = $(this).children('loc').text()
                  var children = $(this).children();
                  var imgchild = $(children).children();
                  var title = $(imgchild[1]).text()
                  if (title === '') {
                    data = {
                      url: url,
                      title: "Title Missing",
                      time: lastmod
                    }
                    arr.push(data)
                  } else {
                    data = {
                      url: url,
                      title: title,
                      time: lastmod
                    }
                    arr.push(data)
                    //console.log(`${title} - ${lastmod}`);
                  }

                });
                if (cycle == 0) {

                } else {
                  //console.log(newprod.length);
                  //console.log(original.length);
                  if (newprod.length > original.length) {
                    console.log('New Item - ' + site);
                    //console.log(diff(newprod, original));
                    events.emit('newitem', {
                      url: diff(newprod, original)[0].url
                    });
                    original = newprod
                  }

                  if (newprod.length < original.length) {
                    original = newprod
                  }

                  if (newprod.length == original.length) {
                    //console.log('Same burv');
                    for (var i = 0; i < newprod.length; i++) {
                      if (newprod[i].time.toString() === original[i].time.toString()) {
                        //console.log(`${newprod[i].time} - ${original[i].time}`);
                      } else {
                        if (lastone === '') {
                          lastone = newprod[i].url
                          events.emit('restock', {
                            url: newprod[i].url,
                            time: newprod[i].time.toString()
                          });
                        } else {
                          if (lastone === newprod[i].url) {
                          } else {
                            lastone = newprod[i].url
                            events.emit('restock', {
                              url: newprod[i].url,
                              time: newprod[i].time.toString()
                            });
                          }
                        }
                      }
                    }
                    original = newprod;
                  }
                }
                cycle++;
                setTimeout(function() {
                  newprod = [];
                  initialize()
                }, config.delay)
            }
          })
          .catch(function(err) {
            //console.log('Err - ' + site);
          })
      }
  }
}



module.exports = {
    init: init
};
