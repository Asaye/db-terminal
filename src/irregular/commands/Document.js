const assert = require('assert');
const ErrorMessages = require('../../utils/ErrorMessages');

const COMPARISONS = [">=", "<=", "=", ">", "<"];
const LOGICALS = [" AND ", " and ", " OR ", " or "];

module.exports = class {
	
	constructor(cmd_name, database) {
		this.document = {};
		if(cmd_name) {
			this.document[cmd_name] = "";
			this.document.$db = database;
		} else {
			this.$db = database;
		}
		this.requestId = 10000000;
	}

	where() {
		var fields = this.data.fields, temp = {};
		if (!this.data.where && (this.data.like || this.data.between || this.data.in)) {
			assert.strictEqual(Array.isArray(this.data.fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
			assert.notEqual(this.data.fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));
		}
		if (this.data.like) {
			temp[fields[0]] = { $regex: this.data.like, $options: 'i' };
		} else if (this.data.between) {
			assert.strictEqual(Array.isArray(this.data.between), true, ErrorMessages.PROP_NOT_ARRAY('between'));
			assert.strictEqual(this.data.between.length >= 2, true, ErrorMessages.ARRAY_INCOMPLETE('between'));
			temp[fields[0]] = { $gt: this.data.between[0], $lt: this.data.between[1] };
		} else if (this.data.in) {
			assert.strictEqual(Array.isArray(this.data.in), true, ErrorMessages.PROP_NOT_ARRAY('in'));
			temp[fields[0]] = { $in: this.data.in };			
		} else if (this.data.where) {	
			const w = this.data.where;
			var array;			
			temp = {};
			LOGICALS.forEach((item) => {
				array = w.split(item);
				if (array.length > 0) {
					array.forEach((c) => {
						temp = {...temp, ...this.getComparables(0, c, item) };
					});					
				}
			});
			
			if (Object.keys(temp).length === 0) temp = this.getComparables(0, w) || {};
		}
		return temp;
	}

	getComparables(index, where, logical) {
		if (index >= COMPARISONS.length || typeof where !== 'string') return;

		var array = where.split(COMPARISONS[index]);

		if (array[0] !== where) {
			array[0] = array[0].trim();
			if (!isNaN(parseFloat(array[1]))) {
				array[1] = parseFloat(array[1]);
			} else {
				array[1] = array[1].trim();
			}
			array.push(COMPARISONS[index]);
			var temp = {};
			
			if (array && Array.isArray(array) && array.length === 3) {
				if (array[2] === COMPARISONS[0]){
					if (logical && logical.toLowerCase() === " or ") {
						temp[array[0]] = { $lt: array[1] };
					} else {
						temp[array[0]] = { $gte: array[1] };
					}					
				} else if (array[2] === COMPARISONS[1]) {
					if (logical && logical.toLowerCase() === " or ") {
						temp[array[0]] = { $gt: array[1] };
					} else {
						temp[array[0]] = { $lte: array[1] };
					}						
				} else if (array[2] === COMPARISONS[2]) {
					if (logical && logical.toLowerCase() === " or ") {
						temp[array[0]] = { $ne: array[1] };
					} else {
						temp[array[0]] = array[1];
					}	
				} else if (array[2] === COMPARISONS[3]) {
					if (logical && logical.toLowerCase() === " or ") {
						temp[array[0]] = { $lte: array[1] };
					} else {
						temp[array[0]] = { $gt: array[1] };
					}						
				} else if (array[2] === COMPARISONS[4]) {
					if (logical && logical.toLowerCase() === " or ") {
						temp[array[0]] = { $gte: array[1] };
					} else {
						temp[array[0]] = { $lt: array[1] };
					}						
				} 				
			}
			return temp;
		}
		return this.getComparables(index + 1, where, logical);
	}
};