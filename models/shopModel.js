const mongoose = require("mongoose");
const validator = require("validator");

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
});

const shop = mongoose.model("Shop", shopSchema);
module.exports = shop;
