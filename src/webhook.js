const request = require('request-promise');
const config = require('../config');
exports.send = function send (webhook, product, type, timestamp) {
  sent = false;
  const opts = {
    method: 'GET',
    uri: product,
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
        for (var i = 0; i < response.product.variants.length; i++) {
          if (response.product.variants[i].inventory_quantity == undefined) {
            stock = 'Unavailable'
          } else if (response.product.variants[i].inventory_quantity == 0) {
            stock = 'Sold Out'
          } else {
            stock = response.product.variants[i].inventory_quantity
          }
          if (response.product.variants[i].updated_at === timestamp) {
            links += `**[${response.product.variants[i].title} - Checkout](http://${product.split('://')[1].split('/')[0]}/cart/${response.product.variants[i].id}:1)**\nStock: ${stock}\n\n`
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
            hookit()
            if (sent == true) {

            } else {
              sent = true;
              console.log('Restock: ' + response.product.title.replace("\/", "/") + ' - ' + product.split("/produ")[0].split('//')[1]);
            }
          } else {
            //console.log('Na dawg it didnt - ' + response.product.title);
          }
        } else {
          hookit()
        }
        function hookit() {
          //console.log('Im finna hook');
          const opts = {
            method: 'POST',
            uri: webhook,
            json: true,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              "embeds": [{
                "color": 65440,
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
                    "name": "Restocked Sizes Links",
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
            console.log('getting err');
            console.log(e.message);
            setTimeout(function() {
              send(webhook, product, type);
            }, 10000)
          })
      }
      }
    })
}
