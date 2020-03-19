const assert = require('assert');
const SQL = require('./SQL');
const ErrorMessages = require('../../utils/ErrorMessages');


module.exports = class extends SQL {

	getSql(data) {

		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		
		this.data = data;

		if (data.database) {
			assert.notEqual(data.database, undefined, ErrorMessages.PROP_NOT_GIVEN('database'));	
			this.sql = `CREATE DATABASE ${data.database} `;
			this.databaseExtras();
		} else if (data.table) {
			assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);
			this.tablePrefix();			
			this.tableFields();
			this.tableExtras();
		}

		return this.sql;
	}	

	databaseExtras() {
		if (this.data.owner) {
			this.sql += `OWNER '${this.data.owner}' `;
		}
		if (this.data.template) {
			this.sql += `TEMPLATE '${this.data.template}' `;
		}
		if (this.data.encoding) {
			this.sql += `ENCODING '${this.data.encoding}' `;
		}
		if (this.data.tablespace) {
			this.sql += `TABLESPACE '${this.data.tablespace}' `;
		}
		if (this.data.connlimit) {
			this.sql += `CONNECTION LIMIT ${this.data.connlimit} `;
		}
	}

	tablePrefix() {
		this.sql = "CREATE TABLE ";
		if (this.data.unlogged) {
			this.sql += "UNLOGGED ";
		} else if (this.data.global || this.data.local) {
			if (this.data.temporary || this.data.temp) {
				this.sql += "TEMPORARY ";
			}
		}
		this.sql += `IF NOT EXISTS ${this.data.table} `;  
	}

	tableFields() {
		const fields = this.data.fields, 
		      types = this.data.dataTypes, 
		      defaults = this.data.defaults, 
		      constraints = this.data.constraints;

		assert.notEqual(fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));	
		assert.strictEqual(Array.isArray(fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
		assert.notEqual(fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));

		if (types) {
			assert.strictEqual(Array.isArray(types), true, ErrorMessages.PROP_NOT_ARRAY('dataTypes'));	
			assert.strictEqual(types.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('dataTypes'));	
		}
		if (defaults) {
			assert.strictEqual(Array.isArray(defaults), true, ErrorMessages.PROP_NOT_ARRAY('defaults'));
			assert.strictEqual(defaults.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('defaults'));		
		}
		if (constraints) {
			assert.strictEqual(Array.isArray(constraints), true, ErrorMessages.PROP_NOT_ARRAY('constraints'));
			assert.strictEqual(constraints.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('constraints'));		
		}

		var column = "";
		var len = this.data.fields.length - 1;
		var cols = this.data.fields.map((col, index) => {
			column = col + " ";
			if (types) {
				column += `${types[index]} `;
			}
			if (constraints && constraints[index]) {
				column += `${constraints[index]} `;
			}

			if (defaults && defaults[index]) {
				column += `DEFAULT '${defaults[index]}' `;
			}
			return column;
		});

		this.sql += `(${cols} `;
		this.constraints();
	}

	tableExtras() {
		if (this.data.inherits) {
			this.sql += `INHERITS ${this.data.inherits} `;
		}
		if (this.data.onCommit) {
			this.sql += `ON COMMIT ${this.data.onCommit} `;
		}
		if (this.data.tablespace) {
			this.sql += `TABLESPACE ${this.data.tablespace} `;
		}
	}
	
	constraints() {		
		if (this.data.unique) {
			this.sql += `, UNIQUE (${this.data.check}) `;
		}
		if (this.data.primaryKey) {
			this.sql += `, PRIMARY KEY (${this.data.primaryKey}) `;
		}
		if (this.data.foreignKey) {
			this.sql += `, FOREIGN KEY (${this.data.foreignKey}) `;
		}
		this.sql += ")";
	}
}