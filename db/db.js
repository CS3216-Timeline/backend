const Pool = require('pg').Pool;
require('dotenv').config()
// This only sets up locally, probably need a devconfig and production config.
// connect to postgres using psql -U postgres
// connect to database using \c pern_starter

const devConfig = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD, 
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
}

const proConfig = {
  connectionString: process.env.DATABASE_URL, 
}

const pool = new Pool(process.env.NODE_ENV == "production" ? proConfig : devConfig);

module.exports = pool;