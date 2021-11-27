const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Item = require('./itemModel');
const ItemSchema = mongoose.model('Item').schema;
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

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
  active: {
    type: Boolean,
    default: false,
  },
  age: {
    type: Number,
    required: true,
    trim: true,
    validate(value) {
      if (value < 14) throw new Error('You are too young!');
    },
  },
  shopInCart: {
    type: mongoose.Schema.Types.ObjectId,
    default: undefined,
  },
  profilePicture: {
    type: String,
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
  PendingOrders: [
    {
      totalCost: {
        type:Number
      },
      order: {
        shopID: {
          type: mongoose.Schema.Types.ObjectId,
        },
        shopName:{
          type: String,
        },
        address: {
          type: String,
          required: true,
        },
        items: [
          {
            type: ItemSchema,
          }
        ],
      },
    },
  ],
  OrderHistory: [
    {
      totalCost: {
        type:Number
      },
      order: {
        shopID: {
          type: mongoose.Schema.Types.ObjectId,
        },
        shopName:{
          type: String,
        },
        address: {
          type: String,
          required: true,
        },
        items: [
          {
            type: ItemSchema,
          }
        ],
      },
    },
  ],
  address: [
    {
      location: {
        type: String,
        trim: true,
      },
      type:{
        type: String,
        enum: ['home', 'work', 'other'],
      },
      _id: false
    }
  ],
  paymentHistory: [
    {
      _id: false,
      totalCost: {
        type: Number,
        trim: true,
      },
      date: {
        type: Date,
      },
      shopName: {
        type: String,
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

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  let user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Incorrect Credentials');
  }
  user = await User.findOne({email}).select('-password');
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
