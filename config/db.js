const env = process.env.NODE_ENV || "localhost";

const localhost = {
  app: {
    port: 3000,
  },
  db: {
    uri: process.env.MONGODB_URI,
  },
};

const config = {
  localhost,
};

if (config[env] && !config[env].db.uri) {
  throw new Error("MONGODB_URI is required. Set it in the process environment before starting the server.");
}

module.exports = config[env];
