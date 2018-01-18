const request = require('request-promise');
exports.send = function(webhook, product, type) {
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
      links = ''
      for (var i = 0; i < response.product.variants.length; i++) {
        if (response.product.variants[i].inventory_quantity == undefined) {
          stock = 'Unavailable'
        } else if (response.product.variants[i].inventory_quantity == 0) {
          stock = 'Sold Out'
        } else {
          stock = response.product.variants[i].inventory_quantity
        }
        links += `**[${response.product.variants[i].title} - Checkout](http://${product.split('://')[1].split('/')[0]}/cart/${response.product.variants[i].id}:1)**\nStock: ${stock}\n\n`
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
      const opts = {
        method: 'POST',
        uri: webhook,
        json: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          "embeds": [{
            "color": 14177041,
            "title" : response.product.title.replace("\/", "/"),
            "url": product,
            "thumbnail": {
              "url": imageurl
            },
            "footer": {
              "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
              "text": "Shopify Monitor by Rock"
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
                "inline": false
              },
              {
                "name": "Links",
                "value": links,
                "inline": true
              }
            ]
          }]
        }
      }
      request(opts)
        .then(function(response) {

        })
    })
}
