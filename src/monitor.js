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
      var array = fs.readFileSync(__dirname + '/../proxies.txt').toString().replace(/\r/g, '').split('\n');
      

      let formatProxy = function(proxy) {
        if (proxy && ['localhost', ''].indexOf(proxy) < 0) {
          proxy = proxy.replace(' ', '_');
          const proxySplit = proxy.split(':');
          if (proxySplit.length > 3) {
            return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
          } else {
            return "http://" + proxySplit[0] + ":" + proxySplit[1];
          }
        } else {
          return undefined;
        }
      }

      function getproxy() {
        if (array.length == 0) {
          var proxy = ''
          return proxy;
        } else {
          var ogprox = array[Math.floor(Math.random() * Math.floor(array.length))]
          return formatProxy(ogprox)
        }
      }

      function diff(one, two) {
        return _.reject(one, _.partial(_.findWhere, two, _));
      }
      //console.log(site);
      //console.log(diff(one, two));
      initialize()
      async function initialize() {
        var mainurl;

        if (site.startsWith('http') == true) {
          if (site.endsWith('/') == true) {
            mainurl = `${site}sitemap.xml`
          } else {
            mainurl = `${site}/sitemap.xml`
          }
        } else {
          if (site.endsWith('/') == true) {
            mainurl = `https://${site}sitemap.xml`
          } else {
            mainurl = `https://${site}/sitemap.xml`
          }
        }

        request({
          method: 'GET',
          uri: mainurl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
          },
          gzip: true,
          proxy: getproxy(),
          simple: false
        }).then(function (data) {
          let $ = cheerio.load(data)

          let sitemap = $('loc')[0]

          //console.log(sitemap.children[0].data);

          let pingUrl = sitemap.children[0].data;
          
          const opts = {
          method: 'GET',
          uri: pingUrl,
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
              cycle++;
              setTimeout(function() {
                newprod = [];
                initialize()
              }, config.delay)
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
                if (cycle != 0) {
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
            console.log('Err - ' + site);
            cycle++;
            setTimeout(function() {
              newprod = [];
              initialize()
            }, config.delay)
          })
        })
      }
  }
}



module.exports = {
    init: init
};
