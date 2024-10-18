db = db.getSiblingDB("bookExchangeDB");
db.createUser({
  user: "user",
  pwd: "user",
  roles: [
    {
      role: "readWrite",
      db: "bookExchangeDB",
    },
  ],
});
