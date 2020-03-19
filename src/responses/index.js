const R_PostgreSQL = require('./R_PostgreSQL');
const R_MySQL = require('./R_MySQL');
const R_MongoDB = require('./R_MongoDB');

module.exports = {
	"postgresql": R_PostgreSQL,
	"mysql": R_MySQL,
	"mongodb": R_MongoDB,
};