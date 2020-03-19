const assert = require('assert');
const Database = require('../Database');
const { Create, Insert, Select, Update, Delete } = require('./commands');
const SQL = require('../regular/commands');
const ErrorMessages = require('../utils/ErrorMessages');

var IrregularDB = class extends Database {

	constructor(type) {
		super(type);
		this._requestId = 0;
	}	

	_send(doc, callback, sql) {
		if (!doc) {
			this.commands.push("Request document could not be constructed");
			return;
		} else {
			this.query(doc, callback, sql);
		}
	}

	create(data, callback) {		
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const doc = new Create(null, this.config.database).getDocument(data);
			const sql = new SQL.Create().getSql(data);
			this._send(doc, callback, sql);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	insert(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			var doc = new Insert(null, this.config.database).getDocument(data);
			const sql = new SQL.Insert().getSql(data);
			this._send(doc, callback, sql);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	select(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const doc = new Select("aggregate", this.config.database).getDocument(data);
			const sql = new SQL.Select().getSql(data);		
			this._send(doc, callback, sql);
		} catch(e) {
			if (callback) callback(e.message);
		}		
	}

	update(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const doc = new Update("update", this.config.database).getDocument(data);
			const sql = new SQL.Update().getSql(data);
			this._send(doc, callback, sql);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	delete(data, callback) {
		try {
			assert.equal(typeof data, 'object', ErrorMessages.DATA_NOT_OBJECT);
			const doc = new Delete("delete", this.config.database).getDocument(data);
			const sql = new SQL.Delete().getSql(data);
			this._send(doc, callback, sql);
		} catch(e) {
			if (callback) callback(e.message);
		}
	}

	onConnect(err) {				
		var callback;			
		if (this.queryQueue.length > 0) {
			const next = this.queryQueue.shift();	
			callback = next.callback;
		}

		if (err) {
			if (callback) callback(err); 
			return;
		} else {
			if (callback) callback(err, "Connection successful.");
			this.socket.setTimeout(360000);
			this.reply.processNext();
		}
	}

	onData(data) {
		this.reply.parse(data);	
		this.socket.on("data", (data) => {
			this.reply.parse(data);
		});
	}
};

module.exports = IrregularDB;