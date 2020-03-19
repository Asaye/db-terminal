const assert = require('assert');
const Database = require('../Database');
const { Create, Insert, Select, Update, Delete } = require('./commands');
const Documents = require('../irregular/commands');
const ErrorMessages = require('../utils/ErrorMessages');

module.exports = class extends Database {

	constructor(type) {
		super(type);
	}	

	_send(sql, callback, doc) {
		if (!sql) {
			this.commands.push("SQL could not be constructed");
			return;
		} else {
			this.query(sql, callback, doc);
		}
	}

	create(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const sql = new Create().getSql(data);	
			const doc = new Documents.Create(null, this.config.database).getDocument(data);
			this._send(sql, callback, doc);
		} catch(e) {
			if (callback) callback(e.message);
		}		
	}

	insert(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const sql = new Insert().getSql(data);
			const doc = new Documents.Insert(null, this.config.database).getDocument(data);
			this._send(sql, callback, doc);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	select(data, callback) {		
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const sql = new Select().getSql(data);
			const doc = new Documents.Select("aggregate", this.config.database).getDocument(data);
				
			this._send(sql, callback, doc);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	update(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const sql = new Update().getSql(data);
			const doc = new Documents.Update("update", this.config.database).getDocument(data);
			this._send(sql, callback, doc);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	delete(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const sql = new Delete().getSql(data);
			const doc = new Documents.Delete("delete", this.config.database).getDocument(data);
			this._send(sql, callback, doc);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}	

	close() { }
}