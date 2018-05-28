var express = require('express');
var app = express();
var whatsapp = require('./simple-whatsapp.js');
var wit = require('./wit.js').Module;
var mdb = require('./tmdb.js').Module;
var traktv = require('./traktv.js').Module;
var moment = require('moment');
var path = require('path');
var fs = require('fs');
var request = require('request');
http = require('http'),
https = require('https');
var Stream = require('stream').Transform;

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  initWhatsapp();
});

let initWhatsapp = () => {
  whatsapp.connect(
    {
      number: '5215582910201',
      password: 'jIHk4QiL0gH7Ah9Xpc4GFOfR+IM=',
      yowsup: '/Users/montoya/Documents/GitHub/yowsup/yowsup-cli'
    }, status => {
      console.log(status);
    }
  );
};

whatsapp.on('message', message => {
  if(message.type == 'text') {
    wit.parseText(message.data).then(response => {
      _answer(getEntities(response), message);
    }, err => {
      console.log(err);
    });
  }
});

whatsapp.on('connection_lost', () => {
  console.log('REBOOTING WHATSAPP');
  setTimeout(function () {
    initWhatsapp();
  }, 1000);
});

//cinema_listing
//https://www.google.com.mx/search?q=hombre%20al%20agua#mie=mt,FilmTicket,hombre%20al%20agua

let getEntities = data => {
  if(data.entities) {
    let array = [];
    if(data.entities.keyword) {
      array = array.concat(data.entities.keyword.map(key => {
        return {
          type: key.type,
          value: key.value
        }
      }));
    }
    if(data.entities.datetime) {
      array = array.concat(data.entities.datetime.map(date => {
        return {
          value: date.value,
          type: date.grain
        }
      }));
    }

    if(data.entities.intent) {
      array = array.concat(data.entities.intent.map(intent => {
        return {
          value: intent.value,
          type: 'intent',
          text: data._text
        }
      }));
    }

    return array;
  } return null;
};

let _answer = (entities, message) => {
  console.log(entities);
  this.is_value = function (value) {
    return entities.find(ent => {
      return ent.value == value;
    });
  };

  this.is_type = function (value) {
    return entities.find(ent => {
      return ent.type == value;
    })
  }

  //DETECT INTENT
  if(obj = this.is_value('cinema_listing')) {
    let date = this.is_type('day') || this.is_type('month') || this.is_type('year');
    if(date) {
      get_now_playing(obj, message);
    } else {
      let text = obj.text.replace(/cartelera/i, '').replace(/para/i, '').replace(/horarios?/i, '').trim();
      let url = 'https://www.google.com.mx/search?q=' + encodeURI(text) +
        '#mie=mt,FilmTicket,' + encodeURI(text);
      if(text && text.length) {
        whatsapp.send_message({to: message.from, data: 'Link de horarios para ' + text + ':'});
        whatsapp.send_message({to: message.from, data: '👉 🍿 ' + url});
      } else {
        text = '¿De qué película deseas conocer el horario? Prueba diciendo: horario para Rampage';
        whatsapp.send_message({to: message.from, data: text})
      }
    }
  } else if (obj = this.is_value('search')) {
    if(type = this.is_value('serie')) {
      let query = message.data.replace(/buscar/i, '').replace(/series?/i, '').trim();
      mdb.search_show(query).then(results => {
        if(results && results.length) {
          let movie = results[0];
          whatsapp.send_message({to: message.from, data: movie.name + ' (★ ' + movie.vote_average + ')'});
          whatsapp.send_message({to: message.from, data: movie.overview});
        } else {
          whatsapp.send_message({to: message.from, data: 'No encontré nada con ese nombre. ¿Lo escribiste bien? 🤔'});
        }
      }, err => {
        console.log(err);
        whatsapp.send_message({to: message.from, data: 'Ocurrió un error 😭'});
      });
    } else if(type = this.is_value('pelicula')) {
      let query = message.data.replace(/buscar/i, '').replace(/pel(i|í)culas?/i, '').trim();
      mdb.search_movie(query).then(results => {
        if(results && results.length) {
          let movie = results[0];
          whatsapp.send_message({to: message.from, data: movie.title + ' (★ ' + movie.vote_average + ')'});
          whatsapp.send_message({to: message.from, data: movie.overview});
        } else {
          whatsapp.send_message({to: message.from, data: 'No encontré nada con ese nombre. ¿Lo escribiste bien? 🤔'});
        }
      }, err => {
        console.log(err);
        whatsapp.send_message({to: message.from, data: 'Ocurrió un error 😭'});
      });
    } else {

    }
  }
};

let get_now_playing = (obj, message) => {
  whatsapp.send_message({to: message.from, data: 'Éstas películas están en cartelera:'});
  mdb.get_now_playing().then(results => {
    let count = 1;
    if(results && results.length) {
      let first = results[0];
      //send image
    }
    results.forEach(movie => {
      if(count < 11) {
        whatsapp.send_message({to: message.from, data: '- ' + movie.title});
        count++;
      }
      else return;
    });
  }, err => {
    console.log(err);
    whatsapp.send_message({to: message.from, data: 'Ocurrió un error 😭'});
  });
};

downloadImage = (url, filename, callback) => {
    var client = http;
    if (url.toString().indexOf("https") === 0){
      client = https;
    }

    client.request(url, function(response) {
      var data = new Stream();

      response.on('data', function(chunk) {
        data.push(chunk);
      });

      response.on('end', function() {
        fs.writeFileSync(filename, data.read());
        return callback(filename);
      });
    }).end()
};
