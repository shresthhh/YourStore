const mongoose = require("mongoose");
const validator = require("validator");

const itemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  demand:{
    type: Number,
    default: 0
  },
  itemDesc: {
    type: String,
    required: true,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    trim: true,
  },
  picture: {
    type: Buffer,
    // reqired: true,
  },
  tags: {
    type: String, 
    trim: true, 
    enum: ['fruits', 'vegetables', 'meat', 'dairy', 'snacks', 'drinks'],
    required: true,
  },
  shopID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  }
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
