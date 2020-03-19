const assert = require('assert');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class {

	where() {
		var fields = this.data.fields;
		if (this.data.like) {
			this.sql += `WHERE ${fields[0]} LIKE ${this.data.like} `;
		} else if (this.data.between) {
			assert.strictEqual(Array.isArray(this.data.between), true, ErrorMessages.PROP_NOT_ARRAY('between'));
			assert.strictEqual(this.data.between.length >= 2, true, ErrorMessages.ARRAY_INCOMPLETE('between'));	
			this.sql += `WHERE ${fields[0]} BETWEEN ${this.data.between[0]} AND ${this.data.between[1]} `;
		} else if (this.data.in && Array.isArray(this.data.in)) {
			assert.strictEqual(Array.isArray(this.data.in), true, ErrorMessages.PROP_NOT_ARRAY('in'));
			this.sql += `WHERE ${fields[0]} IN (${this.data.in}) `;
		} else if (this.data.where) {
			this.sql += `WHERE ${this.data.where} `;	
		}
	}

};