const request = require('request-promise');
const config = require('../config');
exports.send = function (webhook, product, type, timestamp) {
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
  sent = false;
  const opts = {
    method: 'GET',
    uri: product,
    proxy: getproxy(),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
    },
    gzip: true,
    json: true,
    simple: false
  }
  request(opts)
    .then(function(response) {
      var real = false;
      if (type === 'restock') {
        for (var i = 0; i < response.product.variants.length; i++) {
          if (response.product.variants[i].updated_at === timestamp) {
            if (real == false) {
              real = true;
            }
          }
        }
        if (real == true) {
          start()
        } else {

        }
      } else {
        start()
      }
      function start() {
        links = ''
        sizecount = 0;
        for (var i = 0; i < response.product.variants.length; i++) {
          if (response.product.variants[i].inventory_quantity == undefined) {
            stock = 'Unavailable'
          } else if (response.product.variants[i].inventory_quantity == 0) {
            stock = 'Sold Out'
          } else {
            stock = response.product.variants[i].inventory_quantity
          }
          if (response.product.variants[i].updated_at === timestamp) {
            if (sizecount < 6) {
              sizecount++;
              links += `[${response.product.variants[i].title} / Stock: ${stock}](http://${product.split('://')[1].split('/')[0]}/cart/${response.product.variants[i].id}:1)\n`
            }
          }
        }
        if (type === 'restock') {
          type = 'Restock'
        } else {
          type = 'New Item'
        }
        if (response.product.images[0] == undefined) {
          imageurl = 'http://mydaymyplan.com/images/no-image-large.png'
        } else {
          imageurl = response.product.images[0].src.replace("\/", "/");
        }
        var prebrand = response.product.vendor;
        var brand = prebrand.toLowerCase()

        if (config.keywords.length > 0) {
          var matched = false;
          for (var i = 0; i < config.keywords.length; i++) {
            if (response.product.title.toLowerCase().indexOf(config.keywords[i].toLowerCase()) != -1) {
              if (matched == false) {
                matched = true;
              }
            }
          }
          if (matched == true) {
            for (var i = 0; i < config.negkeywords.length; i++) {
              if (response.product.title.indexOf(config.negkeywords[i]) != -1) {
                matched = false;
              }
            }
            if (matched == true) {
              for (let i = 0; i < webhook.length; i++) {
                const hook = webhook[i];
                hookit(hook)
              }
              if (sent != true) {
                sent = true;
                console.log('Restock: ' + response.product.title.replace("\/", "/") + ' - ' + product.split("/produ")[0].split('//')[1]);
              }
            }
          } else {
            //console.log('Na dawg it didnt - ' + response.product.title);
          }
        } else {
          for (let i = 0; i < webhook.length; i++) {
            const hook = webhook[i];
            hookit(hook)
          }
        }
        function hookit(hookUrl) {
          //console.log('Im finna hook');
          if (type === 'Restock') {
            color = 16749381
          } else {
            color = 65440
          }
          const opts = {
            method: 'POST',
            uri: hookUrl,
            json: true,
            proxy: getproxy(),
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              "embeds": [{
                "color": color,
                "title" : response.product.title.replace("\/", "/"),
                "url": product,
                "thumbnail": {
                  "url": imageurl
                },
                "footer": {
                  "icon_url": "https://cdn.shopify.com/s/files/1/1061/1924/products/Heart_Eyes_Emoji_2_large.png?v=1513251039",
                  "text": "Shopify Monitor aka Moneytor - By Rock"
                },
                "fields": [
                  {
                    "name": "Site",
                    "value": product.split('://')[1].split('/')[0],
                    "inline": true
                  },
                  {
                    "name": "Type",
                    "value": type,
                    "inline": true
                  },
                  {
                    "name": "Price",
                    "value": response.product.variants[0].price,
                    "inline": true
                  },
          				{
          				  "name": "Brand",
                    "value": response.product.vendor,
                    "inline": true
          				},
                  {
                    "name": "Checkout Links",
                    "value": links,
                    "inline": true
                  }
                ]
              }]
            }
          }
          request(opts)
          .then(function(response) {
            //console.log('Ya i hooked');
            sent = false;
          })
          .catch(function(e) {
            if (e.message.indexOf('embeds') != -1) {
              sizecount = 0
              links = ''
              if (response.product.variants[i].updated_at === timestamp) {
                if (sizecount < 3) {
                  sizecount++;
                  links += `[${response.product.variants[i].title} / Stock: ${stock}](http://${product.split('://')[1].split('/')[0]}/cart/${response.product.variants[i].id}:1)\n`
                }
              }
            }
            setTimeout(function() {
              send(webhook, product, type);
            }, 10000)
          })
      }
      }
    })
}
