//
// # [wpjs] Whatsapp js
//
//  A node wrapper for yowsup
//  Javier García - Colombia
//
var spawn = require('child_process').spawn;
const EventEmitter = require('events');
const emitter = new EventEmitter();
var MSJ_IN = /^\[(\d+)@.*(\(.*\)).*\](.*)/;
var MSJ_MEDIA = /(\[Media Type:(.*)\])/;
var MSJ_USER = /notify="(.*)" from="(.*)@/;
var args = ['-u'];
var users = {};
var cmd;

let connect = (opts, cb) => {
  args = ['-u'];
  init();
  if(opts.number && opts.password){
    args.push(opts.yowsup || 'yowsup-cli');//Path or global yowup-cli
    args.push('demos');
    args.push('-d');// deb
    args.push('-y');
    args.push('-l', opts.number + ':' + opts.password);
    cmd = spawn('python', args);
    cmd.stdin.setEncoding('utf8');

    console.log('connecting: python ' + args.join(' ') + '\n');

    cmd.stdout.on('data', data => {
      var outConsole = {}
      outConsole.data = data.toString('utf-8').trim();
      outConsole.deb = false;
      emitter.emit('data_received',outConsole);
    });

     cmd.stderr.on('data', data => {
      var outConsole = {}
      outConsole.data = data.toString('utf-8').trim();
      outConsole.deb = true;
      emitter.emit('data_received',outConsole);
    });

    cmd.on('close', data => {
      emitter.emit('error', data);
    });

    emitter.on('online',function(o){
      return cb(o)
    });

  } else {
    return cb('Error: number||password arguments')
  }
};


let send_message = obj => {
  if(obj.to && obj.data) {
    cmd.stdin.write('/message send "' + obj.to + '" "' + obj.data + '"\n');
  } else emitter.emit('error', 'send_message: Invalid format. Message not sent.');
}

let send_image = obj => {
  if(obj.to && obj.data) {
    let caption = obj.caption || '';
    cmd.stdin.write('/image send "' + obj.to + '" "' + obj.data + '" "' + caption + '"\n');
  } else emitter.emit('error', 'send_image: Invalid format. Message not sent.');
}

emitter.on('data_received', function(data) {
  // if it's disconnected
  var message = data.data;
  if(message.includes('[offline]:')){
    cmd.stdin.write('/L\n'); //Connect
  }

  if(message == 'Auth: Logged in!'){
    emitter.emit('online', 'CONNECTED');
  }

  if(message == 'Auth Error, reason not-authorized'){
    emitter.emit('online', 'AUTH ERROR');
  }

  //GET USER NAME
  if(data.deb) {
    var user_number = message.match(MSJ_USER);
    if(user_number) {
      if(user_number[2] in users){
        users[user_number[2]].username = user_number[1]
      } else {
        users[user_number[2]] = {username:user_number[1]}
      }
    }
  }

  // Message in
  if(message.includes('Media Type:')) {
    var message_data = message.match(MSJ_MEDIA);
    console.log('MEDIA MESSAGE');
    console.log(message_data[2]);
  } else {
    var message_data = message.match(MSJ_IN);
    if(message_data) {
      emitter.emit('message',{
        date: parseDate(message_data),
        data: message_data[3].replace('\t','').trim(),
        from: message_data[1],
        username: message_data[1] in users ? users[message_data[1]].username : null,
        type: 'text'
      });
    }
  }
});

emitter.on('error', function (data) {
  if(data.toString() == '1') {
    emitter.emit('connection_lost', data.toString());
  }
});

let parseDate = message_data => {
  var fecha =
    message_data[2].replace(' ','-').replace('(','').replace(')','').replace(':','-').split('-');
  return new Date(fecha[2], parseInt(fecha[1])-1, fecha[0], fecha[3], fecha[4]);
};

let init = () => {
  console.log('===========================');
  console.log('BOTLERS ENTERPRISE WHATSAPP');
  console.log('===========================\n');
};

emitter.connect = connect;
emitter.send_message = send_message;
emitter.send_image = send_image;
module.exports = emitter;
