var wit_url = 'https://api.wit.ai/message?v=20180510&q=';
var wit_token = 'Bearer LBE2BJYG26CTN3BJRT4CRU2376INWFK4';
var request = require('request');

let Wit = function () {
  this.parseText = parseText;
}

let parseText = text => {
  return new Promise((resolve, reject) => {
    var options = {
      url: wit_url + encodeURI(text),
      json: true,
      headers: {
        'Authorization': wit_token
      }
    };

    request(options, (err, httpRes, body) => {
      if(body) resolve(body);
      resolve(null);
    });
  });
};

exports.Module = new Wit();
