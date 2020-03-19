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

		this.data = data;
		
		if (data.table) {
			this.document.create = data.table;
			this.document.$db = this.$db;
			this.tableFields();
		}

		return this.document;
	}	

	
	tableFields() {
		var validator;

		if (this.data.fields) {
			assert.strictEqual(Array.isArray(this.data.fields), undefined, ErrorMessages.PROP_NOT_ARRAY('fields'));
			if (this.data.dataTypes) {
				assert.strictEqual(Array.isArray(this.data.dataTypes), undefined, ErrorMessages.PROP_NOT_ARRAY('dataTypes'));
			}

			this.data.fields.forEach((col, index) => {
				validator = {$jsonSchema: {bsonType: "object", properties: {}}};
				if (index < this.data.dataTypes.length) {
					validator.$jsonSchema.properties[col].bsonType = this.data.dataTypes[index];
				}	
			});


			if (this.data.constraints) {
				assert.strictEqual(Array.isArray(this.data.constraints), undefined, ErrorMessages.PROP_NOT_ARRAY('constraints'));
				var indices = [];
				this.data.constraints.forEach((item, index) => {if ((/not\s+null/i).test(item)) {indices.push(index)}});
				const required = this.data.fields.filter((item, index) => indices.indexOf(index) !== -1);
				if (required.length > 0) {
					if (!validator) validator = {$jsonSchema: {bsonType: "object", properties: {}}};
					validator.$jsonSchema.required = required;
				}
			}		
		}

		if (validator) this.document.validator = validator;
	}	
}