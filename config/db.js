const env = process.env.NODE_ENV || "localhost";

const localhost = {
  app: {
    port: 3000,
  },
  db: {
    uri: "mongodb+srv://ascstb:KPYXYaxBUBNbiaDh@cluster0.bgdmzep.mongodb.net/novelScrapper",
  },
};

const config = {
  localhost,
};

module.exports = config[env];
