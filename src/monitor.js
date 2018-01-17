const config = require('../config');
const request = require('request-promise');
const _ = require('underscore');
const cheerio = require('cheerio');
const events = require('./events');

cycle = 0;
var original = [];
var newprod = [];
var proxylist = [];
/*var fs = require('fs');
var array = fs.readFileSync('proxies.txt').toString().split("\n");
for(i in array) {
    console.log(array[i]);
}

function getproxy() {

}*/

function diff(one, two) {
  return _.reject(one, _.partial(_.findWhere, two, _));
}

module.exports = function init(site) {

  //console.log(diff(one, two));

  console.log('Cycled ' + cycle.toString() + ' - ' + site);
  const opts = {
    method: 'GET',
    uri: `https://${site}/sitemap_products_1.xml`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
    },
    gzip: true,
    json: true,
    simple: false
  }
  request(opts)
    .then(function (data) {
      if (data.indexOf("Try again in a couple minutes") != -1) {
        console.log('You are banned try again later.');
        console.log(data);
      } else {
        $ = cheerio.load(data);
        if (cycle == 0) {
          arr = original;
        } else {
          arr = newprod;
        }
          $('urlset url').each(function() {
            var lastmod = $(this).children('lastmod').text()
            var url = $(this).children('loc').text()
            var children = $(this).children();
            var imgchild = $(children).children();
            title = $(imgchild[1]).text()
            if (title ==='') {

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
            if (newprod.length > original.length) {
              console.log('NEW');
              console.log(diff(newprod, original));
              events.emit('newitem', () => {
                url: diff(newprod, original).url
              })
              original = newprod
            }

            if (newprod.length < original.length) {
              original = newprod
            }

            if (newprod.length == original.length) {
              //console.log('Same burv');
              for (var i = 0; i < newprod.length; i++) {
                if (newprod[i].time === original[i].time) {
                  //console.log(`${newprod[i].time} - ${original[i].time}`);
                } else {
                  console.log('Restock: ' + newprod[i].title);
                  events.emit('restock', () => {
                    url: newprod[i].url
                  })
                }
                original = newprod;
              }
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

/*function check(site) {
  console.log('Cycled');
  const opts = {
    method: 'GET',
    uri: `https://${site}/sitemap_products_1.xml`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
    },
    gzip: true,
    json: true
  }
  request(opts)
    .then(function (newdata) {
      $ = cheerio.load(newdata);
      $('urlset url').each(function() {
        var lastmod = $(this).children('lastmod').text()
        var url = $(this).children('url').text()
        var children = $(this).children();
        var imgchild = $(children).children();
        title = $(imgchild[1]).text()
        if (title ==='') {

        } else {
          data = {
            url: url,
            title: title,
            time: lastmod
          }
          newprod.push(data)
          //console.log(`${title} - ${lastmod}`);
        }
      });

    })
}*/
