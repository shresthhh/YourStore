const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Item = require("./itemModel");
const ItemSchema = mongoose.model("Item").schema;

const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "Point",
  },
  coordinates: {
    type: [Number],
    index: "2dsphere",
  },
});

const shopSchema = new mongoose.Schema({
  shopName: {
    type: String,
    trim: true,
    required: true,
  },
  shopDescription: {
    type: String,
    trim: true,
    required: true,
  },
  geometry: GeoSchema,
  email: {
    type: String,
    trim: true,
    required: true,
    lowercase: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    min: 6,
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
  },
  shopOwner: {
    type: String,
    trim: true,
    required: true,
  },
  items: [
    {
      type: ItemSchema,
      required: true,
    },
  ],
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

shopSchema.methods.generateAuthToken = async function () {
  const store = this;
  const token = jwt.sign({ _id: store._id.toString() }, "NarutoIsAmazing");

  store.tokens = store.tokens.concat({ token });
  await store.save();

  return token;
};

shopSchema.statics.findByCredentials = async (email, password) => {
  const store = await Shop.findOne({ email });
  if (!store) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, store.password);
  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  return store;
};

shopSchema.pre("save", async function (next) {
  const shop = this;
  if (shop.isModified("password")) {
    shop.password = await bcrypt.hash(shop.password, 8);
  }
  next();
});

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
