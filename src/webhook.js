exports.send = function(webhook, product, type) {
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
        "description": `Link: ${product}\nType: ${type}`,
      }]
    }
  }
  rp(opts)
    .then(function(response) {

    })
}
