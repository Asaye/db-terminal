const PSQL_Defaults = {
	"host": "127.0.0.1",
	"port": 5432,
	"user": "postgres",
	"password": "postgres",
	"database": "postgres",
	"keepAlive": 10000,
};

const MSQL_Defaults = {
	"host": "127.0.0.1",
	"port": 3306,
	"user": "root",
	"password": "",
	"database": "mydb",
	"keepAlive": 10000,
};

const MONGO_Defaults = {
	"host": "127.0.0.1",
	"port": 27017,
	"keepAlive": 300000,
	"timeout": 30000
};

module.exports = {
	"postgresql": PSQL_Defaults,
	"mysql": MSQL_Defaults,
	"mongodb": MONGO_Defaults
};