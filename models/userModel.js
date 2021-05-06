const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Item = require('./itemModel');
const ItemSchema = mongoose.model('Item').schema;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid Email');
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
  },
  gender: {
    type: String,
    enum: ['m', 'f', 'o'],
    required: true,
  },
  age: {
    type: Number,
    required: true,
    trim: true,
    validate(value) {
      if (value < 14) throw new Error('You are too young!');
    },
  },
  shopInCart:{
      type: mongoose.Schema.Types.ObjectId,
      default: undefined
  },
  profilePicture: {
    type: Buffer,
    // required: true,
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
  },
  cart: [
    {
      type: ItemSchema,
      required: true,
    },
  ],
  wishlist: [
    {
      type: ItemSchema,
      required: true,
    },
  ],
  OrderHistory: [
    {
      type: ItemSchema,
      required: true,
    },
  ],
  address: [
    {
      type: String,
      trim: true, 
    }
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

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, 'NarutoIsAmazing');

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Incorrect Credentials');
  }

  return user;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
