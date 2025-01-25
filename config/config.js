module.exports = {
  development: {
    username: "postgres",
    password: "Supamodo@8678!",
    database: "sacco_db",
    host: "127.0.0.1",
    port: 5432,
    dialect: "postgres",
    logging: false,
  },
  test: {
    username: "postgres",
    password: "Supamodo@8678!",
    database: "sacco_db_test",
    host: "127.0.0.1",
    port: 5432,
    dialect: "postgres",
    logging: false,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
