const assert = require('assert');
const SQL = require('./SQL');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends SQL {

	getSql(data) {
		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.item, undefined, ErrorMessages.PROP_NOT_GIVEN('item'));			
		if (data.item.indexOf("database") === -1) {
			assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	
		}
		this.data = data;
		if (data.item.indexOf("database") !== -1) {
			assert.notEqual(data.database, undefined, ErrorMessages.PROP_NOT_GIVEN('database'));	
			this.sql = `DROP DATABASE IF EXISTS ${data.database}`;
		} else if (data.item.indexOf("column") != -1) {
			assert.notEqual(data.fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));	
			assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));	
			this.sql = `ALTER TABLE ${data.table} DROP COLUMN ${data.fields} `;
			this.cascade();
		} else if (data.item.indexOf("row") !== -1) {			
			this.sql = `DELETE FROM ${data.table} `;
			if (data.using) {
				this.sql += `${data.using} `;
			}
			this.where();			
		} else if (data.item.indexOf("table") !== -1) {
			if (data.truncate === true) {
				this.sql = `TRUNCATE TABLE ${data.table} `;
			} else {
				this.sql = `DROP TABLE IF EXISTS ${data.table} `;
			}			
			this.cascade();
		}

		return this.sql;
	}

	cascade() {
		if (this.data.cascade === true) {
			this.sql += "CASCADE";
		} else if (this.data.restrict === true) {
			this.sql += "RESTRICT";
		}
	}
};