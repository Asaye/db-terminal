const assert = require('assert');
const Document = require('./Document');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends Document {

	constructor(cmd_name, database) {
		super(cmd_name, database);
	}

	getDocument(data) {

		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);
		assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
		assert.notEqual(data.fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));
		
		
		this.data = data;
		this.document.update = data.table;
		this.document.ordered = false;
		this.document.updates = [{ q: null, u: { $set: null }, upsert: true }];		

		if (!data.from) {
			this.updates();
			this.where();
		} else {
			this.from();
		}		
		return this.document;
	}

	updates() {
		assert.strictEqual(Array.isArray(this.data.values), true, ErrorMessages.PROP_NOT_ARRAY('values'));
		assert.notEqual(this.data.values.length, 0, ErrorMessages.ARRAY_EMPTY('values'));

		var temp = {};
		this.data.fields.forEach((field, index) => {
			temp[field] = this.data.values[index];
		});			
		this.document.updates[0].u.$set = temp;
		if (this.data.fields.length > 0) {
			this.document.updates[0].multi = true;
		}		
	}

	where() {
		if (this.data.where) {			
			const q = this.getComparables(0, this.data.where) || {};
			if (this.document.updates) this.document.updates[0].q = q;
			else if (this.document.pipeline) this.document.pipeline.push({ "$match": q });
		}
	}

	from() {			
		var db = this.document.$db;
		this.document = { "aggregate": this.data.from, "$db": db };
		

		var projection = { _id: 0 };
		this.data.fields.forEach((field) => {
			projection[field] = 1;
		});
		this.document.pipeline = [{ "$project": projection }];
		var match = this.where();
		this.document.pipeline.push(
			{ "$merge": {"into": this.data.table, "on": this.data.fields, "whenMatched": "replace", "whenNotMatched": "insert" } }
		);			
		
		this.document.cursor = { };
	}
};