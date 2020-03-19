const assert = require('assert');
const Document = require('./Document');
const ErrorMessages = require('../../utils/ErrorMessages');

const AGGREGATE_FUNCTIONS = ["count", "avg", "max", "min", "sum"];

module.exports = class extends Document {

	constructor(cmd_name, database) {
		super(cmd_name, database);
	}

	getDocument(data) {
		assert.notEqual(data, undefined, ErrorMessages.DATA_NOT_GIVEN);
		assert.notEqual(data.table, undefined, ErrorMessages.TABLE_NOT_GIVEN);		

		this.data = data;
		var match = this.where();
		if (data.distinct) {
			this.document = { 
				"aggregate": data.table, 
				"$db": this.document.$db, 
				"pipeline": [] 
			};
			if (Object.keys(match).length > 0) this.document.pipeline.push({ $match: match });
			this.document.pipeline.push({$group: {_id: "$" + data.distinct }});			
		} else {
			this.document.aggregate = data.table;
			this.document.pipeline = [];			
			this.limits();
			if (Object.keys(match).length > 0) this.document.pipeline.push({ $match: match });
			this.orderBy();

			if (data.groupBy) {
				this.groupBy();
			} else {
				var group = this.aggregate();
				if (group) this.document.pipeline.push(group);
				this.columns();
				this.joins();
			}
		}

		this.document.cursor = {};

		return this.document;
	}

	aggregate(match, order) {
		var agg;

		for (var fn of AGGREGATE_FUNCTIONS) {
			if (this.data[fn]) {
				agg = fn;
				break;
			}
		}

		if (!agg) return false;		
		
		var group;
		if (agg === "count") {
			group = { $group: { _id: "$" + this.data.count, count: { $sum : 1 } } }; 
		} else {
			var temp = { result: {} };
			temp.result["$" + agg] = "$" + this.data[agg];
			group = { $group: { _id: 1, ...temp } };
		}

		return group;
	}

	columns() {
		var fields = this.data.fields;
		if (!fields) return;
		assert.strictEqual(Array.isArray(fields), true, ErrorMessages.PROP_NOT_ARRAY('fields'));
				
		var projection = { _id: 0 };
		fields.forEach((field) => {
			projection[field] = 1;
		});
		this.document.pipeline.push({ "$project": projection });		
	}

	limits() {
		if (this.data.limit) {
			assert.strictEqual(typeof this.data.limit, "number", ErrorMessages.PROP_NOT_NUMBER('limit'));
			this.document.pipeline.push({ $limit: this.data.limit });
		}
		if (this.data.offset) {
			assert.strictEqual(typeof this.data.offset, "number", ErrorMessages.PROP_NOT_NUMBER('offset'));
			this.document.pipeline.push({ $skip: this.data.offset });
		}		
	}

	joins() {	
		var projection = { _id: 0 };
		this.data.fields.forEach((field) => {
			projection[field] = 1;
		});		

		if (this.data.leftJoin) {
			var on;
			if (this.data.on) {
				on = this.data.on.split("=");
			}
				
			if (on && on.length > 1) {
				const local = on[0].trim().split(".");
				const foreign = on[1].trim().split(".");
				this.document.pipeline.push({ "$lookup": {"from": this.data.leftJoin, as: 'leftJoin', 
					"localField": local.length > 1 ? local[1] : local[0],
					"foreignField": foreign.length > 1 ? foreign[1] : foreign[0]} });
			} else {				
				this.document.pipeline.push({ "$lookup": {"from": this.data.leftJoin, as: 'leftJoin', 
				pipeline: [{$project: projection}] }});
				this.document.pipeline.push({ $unwind: "$leftJoin" });
			}			
		} else if (this.data.fullOuterJoin) {
			this.document.pipeline.push({ "$lookup": {"from": this.data.leftJoin, as: 'fullOuterJoin', 
				pipeline: [{$project: projection}] }});
				this.document.pipeline.push({ $unwind: "$leftJoin" });
		}		
	}

	orderBy() {
		if (this.data.orderBy) {
			var temp = {};
			temp[this.data.orderBy] = 1;
			if (this.data.order && this.data.order.toLowerCase() === "desc") {
				temp[this.data.orderBy] = -1;
			} 			
			this.document.pipeline.push({ $sort: temp });
		}
	}

	groupBy() {
		if (this.data.groupBy) {
			var group = this.aggregate() || {} ;
			this.document.pipeline.push({ $group: { _id: "$" + this.data.groupBy, aggregate: group } });			
		}
		if (this.data.having) {
			var match = this.where();
			this.document.pipeline.push({ $match: { "having": match } });
		}		
	}
};
