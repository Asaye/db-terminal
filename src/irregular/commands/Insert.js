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
		assert.notEqual(data.item, undefined, ErrorMessages.PROP_NOT_GIVEN('item'));	
		assert.notEqual(data.fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));	
		assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));	

		this.data = data;

		if (this.data.item.indexOf("column") != -1) {
			var db = this.document.$db;	
			this.document.update = data.table;	
			this.document.$db = this.$db;
			this.insertColumn();
			this.document.ordered = false;			
		} else if (this.data.item.indexOf("row") != -1) {			
			this.document.insert = data.table;
			this.document.$db = this.$db;
			this.insertRow();
		}		

		return this.document;
	}

	insertColumn() {			
	
		if (this.data.defaults) {
			assert.strictEqual(Array.isArray(this.data.defaults), true, ErrorMessages.PROP_NOT_ARRAY('defaults'));	
		}
			
		var temp = { $set: {} };
		this.data.fields.forEach((field, index) => {
			if (this.data.defaults && index < this.data.defaults.length) {
				temp.$set[field] = this.data.defaults[index];
			} else {
				temp.$set[field] = "";
			}
		});

		this.document.updates =[{ q: {}, u: temp, multi: true }];		
	}

	insertRow() {		
		if (this.data.multirow === true && this.data.values) {
			assert.strictEqual(Array.isArray(this.data.fields), true, ErrorMessages.PROP_NOT_ARRAY('values'));	
			var temp = {}, doc = [];
			this.data.values.forEach((vals) => {
				temp = {};
				this.data.fields.forEach((field, index) => {
					temp[field] = vals[index];
				});
				doc.push(temp);
			});
			this.document.documents = doc;
		} else if (this.data.sourceTable) {		
			var db = this.document.$db;
			this.document = { "aggregate": this.data.sourceTable, "$db": db };
			var match = this.where();
	
			var projection = { _id: 0 };
			this.data.fields.forEach((field) => {
				projection[field] = 1;
			});
			this.document.pipeline = [{ "$project": projection }];
			if (match && Object.keys(match).length > 0) {
				this.document.pipeline.push({ "$match": match });
			}
			this.document.pipeline.push(
				{ "$merge": {"into": this.data.table, "on": this.data.fields, "whenMatched": "replace", "whenNotMatched": "insert" } }
			);			
			
			this.document.cursor = { };
		} else {
			assert.strictEqual(Array.isArray(this.data.fields), true, ErrorMessages.PROP_NOT_ARRAY('values'));
			var temp = {};
			this.data.fields.forEach((field, index) => {
				temp[field] = this.data.values[index];
			});
			this.document.documents = [temp];
		}
		return null;
	}
};