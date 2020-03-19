const assert = require('assert');
const SQL = require('./SQL');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends SQL {

	getSql(data) {

		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);		
		assert.notEqual(data.fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));
		assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));	
		assert.notEqual(data.fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));

	
		var hasValues = data.values && Array.isArray(data.values) 
		                            && data.values.length > 0;
	
		if (data.fields.length === 1) {
			this.sql = `UPDATE ${data.table} SET `;
		} else {
			this.sql = `UPDATE ${data.table} SET `;
		} 

		if (data.from) {
			this.sql += data.fields.length > 1 ? `(${data.fields}) = ` : `${data.fields[0]} = `;
			var fields = data.fields;
			if (data.sourceFields) {
				assert.strictEqual(Array.isArray(data.sourceFields), true, ErrorMessages.PROP_NOT_ARRAY('sourceFields'));	
				assert.notEqual(data.sourceFields.length, 0, ErrorMessages.ARRAY_EMPTY('sourceFields'));
				fields = data.sourceFields;
			}	
			this.sql += `(SELECT ${fields} FROM ${data.from} `;
		} else {
			assert.notEqual(data.values, undefined, ErrorMessages.PROP_NOT_GIVEN('values'));
			assert.strictEqual(Array.isArray(data.values), true, ErrorMessages.PROP_NOT_ARRAY('values'));
			data.fields.forEach((field, index) => {
				this.sql += `${field} = ${data.values[index]} ${index < data.fields.length - 1 ? "," : ""}`;
			});
		}

		if (data.where) {
			this.sql += `WHERE ${data.where}`;
		}
		
		if (data.from) {
			this.sql += ")";
		}

		return this.sql;
	}
};