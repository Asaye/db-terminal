const assert = require('assert');
const SQL = require('./SQL');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends SQL {

	getSql(data) {

		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	
		assert.notEqual(data.item, undefined, ErrorMessages.PROP_NOT_GIVEN('item'));	
		assert.notEqual(data.fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));
		assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));	
		assert.notEqual(data.fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));

		this.data = data;
		
		if (data.item.indexOf("column") != -1) {
			this.sql = `ALTER TABLE ${data.table} ADD COLUMN `;
			this.insertColumn();
		} else if (data.item.indexOf("row") != -1) {
			this.sql = `INSERT INTO ${data.table} `;

			if (data.defaults) {
				this.sql += "DEFAULT VALUES";				
				return this.sql;
			}
			this.insertRow();
		}
		return this.sql;
	}

	insertColumn() {
		const fields = this.data.fields, 
		      types = this.data.dataTypes, 
		      defaults = this.data.defaults, 
		      constraints = this.data.constraints,
		      len = this.data.fields.length - 1;		

		//if (types) {
			assert.notEqual(types, undefined, ErrorMessages.PROP_NOT_GIVEN('dataTypes'));
			assert.strictEqual(Array.isArray(types), true, ErrorMessages.PROP_NOT_ARRAY('dataTypes'));	
			assert.strictEqual(types.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('dataTypes'));	
		//}
		if (defaults) {
			assert.strictEqual(Array.isArray(defaults), true, ErrorMessages.PROP_NOT_ARRAY('defaults'));
			assert.strictEqual(defaults.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('defaults'));		
		}
		if (constraints) {
			assert.strictEqual(Array.isArray(constraints), true, ErrorMessages.PROP_NOT_ARRAY('constraints'));
			assert.strictEqual(constraints.length >= fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('constraints'));		
		}

		for (let i = 0; i < len; i++) {
			this.sql += `${this.data.fields[i]} `;
			if (types) {
				this.sql += `${types[i]} `;
			}
			if (constraints) {
				this.sql += `${constraints[i]} `;
			}
			if (defaults) {
				this.sql += `DEFAULT ${defaults[i]} `;
			}
			this.sql += ",";
		}

		this.sql += `${fields[len]} `;
		this.sql += `${types[len]} `;
		
		if (constraints) {
			this.sql += `${constraints[len]} `;
		}
		if (defaults) {
			this.sql += `DEFAULT ${defaults[len]} `;
		}		
	}

	insertRow() {
		const values = this.data.values;
		if (!this.data.sourceTable) {
			assert.strictEqual(Array.isArray(values), true, ErrorMessages.PROP_NOT_ARRAY('values'));
			assert.strictEqual(values.length >= this.fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('values'));	
		}
		
		if (this.data.multirow === true && this.data.values) {			
			const len = values.length - 1;
			this.sql += "VALUES ";
			for (var i = 0; i < len; i++) {
				this.sql += `('${values[i].join("','")}'),`;
			}
			this.sql += `(${values[len]})`;
		} else {
			if (this.data.sourceTable) {
				if (this.data.sourceFields) {
					const fields = this.data.sourceFields;
					assert.strictEqual(Array.isArray(fields), true, ErrorMessages.PROP_NOT_ARRAY('sourceFields'));
					assert.strictEqual(fields.length >= this.fields.length, true, ErrorMessages.ARRAY_INCOMPLETE('sourceFields'));
					this.sql += `SELECT ${fields} from ${this.data.sourceTable}`;
					this.data.fields = [fields[0]];
				} else {
					this.sql += `SELECT ${this.data.fields} from ${this.data.sourceTable}`;
				}				
				this.where();
			} else {
				this.sql += `VALUES ('${this.data.values.join("','")}')`;
			}
		}
	}
};