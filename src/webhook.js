const request = require('request-promise');
exports.send = function(webhook, product, type) {
  console.log('NEW ITEM YEA OR RESTOCK LMAO');
  const opts = {
    method: 'POST',
    uri: webhook,
    json: true,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      "embeds": [{
        "color": '14177041',
        "title" : "SHOPIFY",
        "description": `Link: ${product.toString()}\nType: ${type}`,
      }]
    }
  }
  request(opts)
    .then(function(response) {

    })
}
