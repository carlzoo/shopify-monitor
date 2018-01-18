const config = require('../config');
const request = require('request-promise');
const _ = require('underscore');
const cheerio = require('cheerio');
const events = require('./events');

cycle = 0;
var original = [];
var newprod = [];
var proxylist = [];
var fs = require('fs');
var array = fs.readFileSync(__dirname + '/../proxies.txt').toString().split("\n");
for(i in array) {
  if (array[i] === '') {

  } else {
    proxylist.push(array[i])
  }
}

function getproxy() {
  if (proxylist.length == 0) {
    proxy = 'http://localhost'
    return proxy;
  } else {
    ogprox = proxylist[Math.floor(Math.random() * proxylist.length)]
    if (ogprox.split(':')[2] == undefined) {
      proxy = `http://${ogprox.split(':')[0]}:${ogprox.split(':')[1]}`
      return proxy;
    } else {
      proxy = `http://${ogprox.split(':')[2]}:${ogprox.split(':')[3]}@${ogprox.split(':')[0]}:${ogprox.split(':')[1]}`
      return proxy;
    }
  }
  console.log(proxy);
}

function diff(one, two) {
  return _.reject(one, _.partial(_.findWhere, two, _));
}

module.exports.init = function init(site) {

  //console.log(diff(one, two));

  //console.log('Cycled ' + cycle.toString() + ' - ' + site);
  const opts = {
    method: 'GET',
    uri: `${site}/sitemap_products_1.xml`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
    },
    gzip: true,
    proxy: getproxy(),
    json: true,
    simple: false
  }
  request(opts)
    .then(function (data) {
      if (data.toString().indexOf("Try again in a couple minutes") != -1) {
        console.log('You are banned try again later. - ' + site);
        console.log(data);
      } else {
        $ = cheerio.load(data);
        if (cycle == 0) {
          arr = original;
          //console.log('og');
        } else {
          arr = newprod;
          //console.log('newprod');
        }
          $('urlset url').each(function() {
            var lastmod = $(this).children('lastmod').text()
            var url = $(this).children('loc').text()
            var children = $(this).children();
            var imgchild = $(children).children();
            title = $(imgchild[1]).text()
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
              console.log('NEW');
              console.log(diff(newprod, original));
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
                  console.log('Restock: ' + newprod[i].title);
                  events.emit('restock', {
                    url: newprod[i].url
                  });
                }
              }
              original = newprod;
            }
          }
          cycle++;
          setTimeout(function() {
            newprod = [];
            init(site)
          }, config.delay)
      }
    })
}
