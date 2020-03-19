const assert = require('assert');
const SQL = require('./SQL');
const ErrorMessages = require('../../utils/ErrorMessages');

const AGGREGATE_FUNCTIONS = ["count", "avg", "max", "min", "sum"];

module.exports = class extends SQL {

	getSql(data) {	
		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);	

		this.data = data;
		this.sql = "SELECT ";

		var temp = 0;

		this.distinct();
		temp = this.sql.length;
		this.aggregate();

		if (temp === this.sql.length) {
			this.columns();
		}
		
		this.sql += `FROM ${data.table} `;

		this.where();
		this.limits();
		this.joins();
		this.on();
		this.merges();
		this.orderBy();
		this.groupBy();
		this.having();

		return this.sql;
	}


	distinct() {
		if (this.data.distinct === true) {
			this.sql += "DISTINCT ";
		}
	}

	aggregate() {
		var agg;

		for (var fn of AGGREGATE_FUNCTIONS) {
			if (this.data[fn]) {
				agg = fn;
				break;
			}
		}

		if (agg === undefined) return;

		if (agg === "count") {
			this.sql += "COUNT(*) ";
		} else {
			this.sql += `${agg} (${this.data[agg]}) `;
		}
	}

	columns() {
		var fields = this.data.fields;		
		
		if (fields) {
			assert.strictEqual(Array.isArray(fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
			assert.notEqual(fields.length, 0, ErrorMessages.ARRAY_EMPTY('fields'));
			this.sql += `${fields} `;
		} else {
			this.sql += "* ";
		}
	}

	limits() {
		if (this.data.limit) {
			assert.strictEqual(typeof this.data.limit, "number", ErrorMessages.PROP_NOT_NUMBER('limit'));
			this.sql += `LIMIT ${this.data.limit} `;
		}
		if (this.data.offset) {
			assert.strictEqual(typeof this.data.offset, "number", ErrorMessages.PROP_NOT_NUMBER('offset'));
			this.sql += `OFFSET ${this.data.offset} `;
		}
	}

	joins() {
		if (this.data.innerJoin) {
			this.sql += `INNER JOIN ${this.data.innerJoin} `;
		}
		if (this.data.leftJoin) {
			this.sql += `LEFT JOIN ${this.data.leftJoin} `;
		}
		if (this.data.fullOuterJoin) {
			this.sql += `FULL OUTER JOIN ${this.data.fullOuterJoin} `;
		}
		if (this.data.crossJoin) {
			this.sql += `CROSS JOIN ${this.data.crossJoin} `;
		}
		if (this.data.naturalJoin) {
			this.sql += `NATURAL JOIN ${this.data.naturalJoin} `;
		}
	}

	on() {
		if (this.data.on) {
			this.sql += `ON ${this.data.on} `;
		}
	}

	merges() {
		if (this.data.union) {
			this.sql += `UNION SELECT * FROM ${this.data.union} `;
		}
		if (this.data.except) {
			this.sql += `EXCEPT SELECT * FROM ${this.data.except} `;
		}
		if (this.data.intersect) {
			this.sql += `INTERSECT SELECT * FROM ${this.data.intersect} `;
		}
	}

	orderBy() {
		//if (this.data.orderBy  && Array.isArray(this.data.orderBy)) {
			//const hasOrder = this.data.order && Array.isArray(this.data.order);
			//if (hasOrder) {
			//	for (var i = 0; i < this.data.order.length; i++) {
				//	this.data.orderBy[i] += ` ${this.data.order[i]}`;
				//}
			//}
		if (this.data.orderBy) {
			this.sql += `ORDER BY ${this.data.orderBy} `;
			if (this.data.order) {
				this.sql += `${this.data.order} `;
			}
		}
	}

	groupBy() {
		if (this.data.groupBy) {
			assert.strictEqual(Array.isArray(this.data.groupBy), true, ErrorMessages.PROP_NOT_ARRAY('groupBy'));
			this.sql += `GROUP BY ${this.data.groupBy} `;
		}
	}

	having() {
		if (this.data.having) {
			this.sql += `HAVING ${this.data.having} `;
		}
	}
};
