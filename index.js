const PostgreSQL = require("./src/regular/postgresql/PostgreSQL.js");
const MySQL = require("./src/regular/mysql/MySQL.js");
const MongoDB = require("./src/irregular/mongodb/MongoDB.js");

module.exports = (database) => {
	const db = (instance) => {
		return {
			"connect": instance.connect.bind(instance),
			"create": instance.create.bind(instance),
			"insert": instance.insert.bind(instance),
			"select": instance.select.bind(instance),
			"update": instance.update.bind(instance),
			"delete": instance.delete.bind(instance),
			"query": instance.query.bind(instance),
			"close": instance.close.bind(instance),
			"commands": instance.commands
		};
	};
	switch (database) {
		case "postgresql" : {
			var pg = new PostgreSQL("postgresql");
			return db(pg);
			break;
		}
		case "mysql" : {
			var mysql = new MySQL("mysql");
			return db(mysql);
			break;
		}
		case "mongodb" : {
			var mongo = new MongoDB("mongodb");
			return db(mongo);
			break;
		}
	}
};
