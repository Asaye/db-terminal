const crypto = require('crypto');
const RegularDB = require('../RegularDB');
const ErrorMessages = require('../../utils/ErrorMessages');

const xor = function (a, b) {
  a = Buffer.from(a, 'binary');
  b = Buffer.from(b, 'binary');
  var result = Buffer.allocUnsafe(a.length);
  for (var i = 0; i < a.length; i++) {
    result[i] = (a[i] ^ b[i]);
  }
  return result;
};

function crypt(input) {
  var output = [];
  var charCode;
  for (var i = 0; i < input.length; i++) {
      charCode = input.charCodeAt(i) ^ key[i % key.length].charCodeAt(0);

  output.push(String.fromCharCode(charCode));
  }
  return output.join("");
};

const sha1 = function (msg) {
  var hash = crypto.createHash('sha1');
  hash.update(msg, 'binary');
  return hash.digest('binary');
}

const token = function(password, scramble) {
  var stage1 = sha1((Buffer.from("", 'utf8')).toString('binary'));
  var stage2 = sha1(stage1);
  var stage3 = sha1(scramble.toString('binary') + stage2);
  return xor(stage3, stage1);
};

module.exports = class extends RegularDB  {

	constructor(type) {
		super(type)
	}

	startup() { }

	onPassword(data) {
		if (!data || data.length < 50) return;
		
		var packet, offset = 17, len, count = 0, end;		
		var scramble = [];
		
		var length = data.readIntLE(0, 3);
		var sequenceNum = data.readInt8(3);
		var protocolVersion = data.readInt8(4);
		offset = data.indexOf(0, 5);
		
		var serverVersion = data.slice(5, 5 + (offset - 4));
		var threadId = data.readIntLE(offset + 1, 4);
		var scramble1 = data.slice(offset + 5, offset + 13);
		var serverCapability = data.readIntLE(offset + 14, 2);
		var charset = data.readInt8(offset + 16);
		var serverStatus = data.readIntLE(offset + 17, 2);
		var filler = data.slice(offset + 19, offset + 32);
		var scramble2 = null;
		if (data.length >= offset + 32) {
			scramble2 = data.slice(offset + 32, offset + 44);
		}

		if (scramble2 != null) {
			scramble = Buffer.concat([scramble1, scramble2]);
			//sha1(scramble);
		} else {
			//xor(scramble1);
		}
		
		var len, pwd;

		if (this.config.password) {
			pwd = Buffer.alloc(21);
			pwd.writeInt8(20);
			token(this.config.password, scramble).copy(pwd, 1);	
		} else {
			pwd = Buffer.alloc(1);
		}

		const len_user = this.config.user.length;
		const len_db = this.config.database.length;

		len = 3 + 1 + 9 + 23 + len_user + 1 + pwd.length + len_db + 1;
		const buffer = Buffer.alloc(len);
		buffer.writeIntLE(len - 3 - 1, 0, 3);
		buffer[3] = 0x1;
		buffer.writeInt32LE(0x000008 | 0x00000200 | 0x00020000 | 0x00040000 | 0x2000, 4); // capablity flag of the client
		buffer.writeInt32LE(0, 8); // max size of a command packet that the client wants to send to the server
		buffer.writeInt8(33, 12); // charset code for utf-8
		buffer.write(this.config.user + "\0", 36, len_user + 1);
		pwd.copy(buffer, 36 + len_user + 1);
		buffer.write(this.config.database + "\0", 36 + len_user + 1 + pwd.length, len_db + 1);    
    this.socket.write(buffer);
	}

	handleData(data) {
	 	if (!data) return;
	 	this.reply.parse(data);
	}

	query(text, callback, doc) {

		if (!text) {
			if (callback) callback(ErrorMessages.DATA_NOT_GIVEN);
			return;
		} else if (typeof text !== 'string') {
			if (callback) callback(ErrorMessages.DATA_NOT_STRING);
			return;
		}

		this.commands.push({ sql: text, nosql: doc });		
	
		const buffer = Buffer.alloc(4 + 1 + text.length);
		buffer.writeInt32LE(1 + text.length);
		buffer.writeInt8(3, 4);
		buffer.write(text, 5, text.length);   
	    
		this.addQuery(buffer, callback);
	}

	close() {
		const buffer = Buffer.alloc(3 + 1 + 1);
		buffer.writeIntLE(1, 0, 3);
		buffer[4] = 0x01;
		this.socket.end(buffer);
	}
}