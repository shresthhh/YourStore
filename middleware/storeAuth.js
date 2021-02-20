const jwt = require("jsonwebtoken");
const Shop = require("./../models/storeModel");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "NarutoIsAmazing");
    const store = await Shop.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!store) {
      throw new Error();
    }

    req.token = token;
    req.store = store;
    next();
  } catch (e) {
    res.status(401).send("Please Authenticate");
  }
};

module.exports = auth;
