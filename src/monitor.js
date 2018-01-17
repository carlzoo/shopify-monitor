const config = require('../config');
const request = require('request-promise');
const _ = require('underscore');
const cheerio = require('cheerio');
const events = require('./events');

var original = []
var newprod = []

function diff(newdata, olddata) {
  return _.difference(newdata, olddata)
}

module.exports = function init(site) {
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
    .then(function (data) {
      $ = cheerio.load(data);
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
            original.push(data)
            //console.log(`${title} - ${lastmod}`);
          }

        });
      /*setTimeout(function() {
        check(site)
      }, config.delay)*/
    })
}

function check(site) {
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
      if (newprod.length > original.length) {
        console.log('New Item: ' + newprod[i].title);
        events.emit('newitem', () => {
          url: diff(newprod, original)[0].url
        })
      }

      if (newprod.length < original.length) {

      }

      if (newprod.length == original.length) {
        for (var i = 0; i < newprod.length; i++) {
          if (newprod[i].time === original[i].time) {

          } else {
            console.log('Restock: ' + newprod[i].title);
            events.emit('restock', () => {
              url: newprod[i].url
            })
          }
        }
      }
      original = []
      for (var i = 0; i < newprod.length; i++) {
        original.push(newprod[i])
      }
      newprod = []
      setTimeout(function() {
        check(site)
      }, config.delay)
    })
}
