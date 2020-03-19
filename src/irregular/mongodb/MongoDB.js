const IrregularDB = require('../IrregularDB');
const Protocol = require('../../utils/Protocol');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends IrregularDB  {

	query(data, callback, doc2) {		
		if (!data) {
			if (callback) callback(ErrorMessages.DATA_NOT_GIVEN);
			return;
		} else if (typeof data !== 'object') {
			if (callback) callback(ErrorMessages.DATA_NOT_OBJECT);
			return;
		}
		
		if (!data.$db) data.$db = this.config.database;

		this._requestId++;

		const protocol = new Protocol(this._requestId);
		this.commands.push({ nosql: data, sql: doc2 });
		const buffer = protocol.getBuffer(data);			
		
		this.addQuery(buffer, callback, this._requestId, protocol);
	}

	close() {
		this.socket.end();
	}
}