// https://coligo.io/create-url-shortener-with-node-express-mongo/
var alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
var base = alphabet.length;
var uid = require('uid');

function encode(num){
  var encoded = '';
  while (num){
    var remainder = num % base;
    num = Math.floor(num / base);
    encoded = alphabet[remainder].toString() + encoded;
  }
  return encoded;
}

function decode(str){
  var decoded = 0;
  while (str){
    var index = alphabet.indexOf(str[0]);
    var power = str.length - 1;
    decoded += index * (Math.pow(base, power));
    str = str.substring(1);
  }
  return decoded;
}

var url = `http://localhost/#/forms/filings/${uid(27)}`;
var seq = 1;
var encodedId = encode(seq);
var decodedId = decode(encodedId);

console.log('ID:', seq, '; ENCODED ID:', encodedId, '; DECODED ID:', decodedId, '; Are the same?', seq === decodedId);

// module.exports.encode = encode;
// module.exports.decode = decode;