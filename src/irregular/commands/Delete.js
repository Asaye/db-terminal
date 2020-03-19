const assert = require('assert');
const Document = require('./Document');
const ErrorMessages = require('../../utils/ErrorMessages');

module.exports = class extends Document {

	constructor(cmd_name, database) {
		super(cmd_name, database);
	}

	getDocument(data) {

		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.item, undefined, ErrorMessages.PROP_NOT_GIVEN('item'));

		this.data = data;		

		if (data.item.indexOf("database") !== -1) {	
			assert.notEqual(data.database, undefined, ErrorMessages.PROP_NOT_GIVEN('database'));		
			this.document = { dropDatabase: 1, $db: data.database };
		} else if (data.item.indexOf("column") !== -1) {
			assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	
			assert.notEqual(data.fields, undefined, ErrorMessages.PROP_NOT_GIVEN('fields'));
			assert.strictEqual(Array.isArray(data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
			var projection = { };
			this.data.fields.forEach((field) => {
				projection[field] = "";
			});
			this.document = { 
				"update": data.table, 
				"$db": this.document.$db, 
				"updates": [{ "q": { }, "u": { "$unset": projection }, "multi": true }] 
			};
		
		} else if (data.item.indexOf("row") !== -1) {		
			assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	
			assert.notEqual(data.where, undefined, ErrorMessages.PROP_NOT_GIVEN('where'));	
			this.document.delete = data.table;
			this.document.deletes = [{ q: null, limit: 0 }];
			this.document.ordered = false;
			this.document.deletes[0].q = this.where();	
		} else {
			assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	
			if (data.truncate === true) {
				this.document.delete = data.table;
				this.document.deletes = [{ q: null, limit: 0 }];		
				return this.document;
			} else {
				this.document.drop = data.table;
			}		
		}

		return this.document;
	}	
};