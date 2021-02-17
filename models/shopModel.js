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
  item: [
    {
      item: {
        type: ItemSchema,
        required: true,
      },
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

shopSchema.pre("save", async function (next) {
  const shop = this;
  if (shop.isModified("password")) {
    shop.password = await bcrypt.hash(shop.password, 8);
  }
  next();
});

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
