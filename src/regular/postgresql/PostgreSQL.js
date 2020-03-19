const crypto = require('crypto')
const RegularDB = require('../RegularDB');
const ErrorMessages = require('../../utils/ErrorMessages');

const md5 = function (string) {
  return crypto.createHash('md5').update(string, 'utf-8').digest('hex')
};

const postgresMd5PasswordHash = function (user, password, salt) {
  var inner = md5(password + user)
  var outer = md5(Buffer.concat([Buffer.from(inner), salt]))
  return 'md5' + outer
};

module.exports = class extends RegularDB  {
	constructor(type) {
		super(type)
	}

	startup() { 
		const str = `user\0${this.config.user}\0database\0${this.config.database}\0client_encoding\0'utf-8'\0\0`;
		const buffer = Buffer.alloc(str.length + 4 + 4);
		buffer.writeInt32BE(buffer.length);
		buffer.writeInt32BE(196608, 4); // protocol version
		buffer.write(str, 8, str.length);
		this.socket.write(buffer);
	}

	onPassword(data) {
		const salt = data.slice(9);
		const hash = postgresMd5PasswordHash(this.config.user, this.config.password, salt);
		const buffer = Buffer.alloc(1 + 4 + hash.length + 1);

		buffer.write("p", 0, 1);
		buffer.writeInt32BE(4 + hash.length + 1, 1);
		buffer.write(hash + "\0", 5, hash.length + 1);

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

		const buffer = Buffer.alloc(1 + 4 + text.length + 1);
		this.commands.push({ sql: text, nosql: doc });		
		buffer.write("Q", 0, 1);
		buffer.writeInt32BE(4 + text.length + 1, 1); // + 4 (for header) + 1 (for null character)
		buffer.write(text + "\0", 5, text.length + 1);		

		this.addQuery(buffer, callback);
	}

	close() {
		const buffer = Buffer.alloc(1 + 4);	
		buffer.write("X", 0, 1);
		buffer.writeInt32BE(4, 1); 
		this.socket.end(buffer);
	}
}