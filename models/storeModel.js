const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const Item = require('./itemModel');
const ItemSchema = mongoose.model('Item').schema;

const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    index: '2dsphere',
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
  totalClicks: {
    type: Number,
    default: 0,
  },
  totalItemsSold: {
    type: Number,
    default: 0,
  },
  // geometry: GeoSchema,
  email: {
    type: String,
    trim: true,
    required: true,
    lowercase: true,
    unique: true,
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
    min: 6,
  },
  shopRating: {
    type: Number,
    default: 5,
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
  profitsDaily: {
    type: Number,
    default: 0,
  },
  profitsYearly: {
    type: Number,
    default: 0,
  },
  profitsMonthly: {
    type: Number,
    default: 0,
  },
  items: [
    {
      type: ItemSchema,
      required: true,
    },
  ],
  trendingItem: {
    type: ItemSchema,
  },
  maxDemand:{
    type: Number,
    default: 0,
  },
  itemsDemanded: [
    {
      prodName: {
        type: String,
      },
      desc: {
        type: String,
      },
      userName: {
        type: String,
      },
      phoneNumber: {
        type: Number,
      },
      qty: {
        type: Number,
      },
    },
  ],
  delivery: [
    {
      user: {
        userID: {
          type: mongoose.Schema.Types.ObjectId,
        },
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone: {
          type: Number,
          required: true,
        },
        items: [
          {
            type: ItemSchema,
          },
        ],
      },
    },
  ],
  deliveryHistory: [
    {
      user: {
        userID: {
          type: mongoose.Schema.Types.ObjectId,
        },
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone: {
          type: Number,
          required: true,
        },
        items: [
          {
            type: ItemSchema,
          },
        ],
      },
    },
  ],
  location: {
    //GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number], //[long, lat]
    address: String,
    landmark: String,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

shopSchema.index({ location: '2dsphere' });

shopSchema.methods.generateAuthToken = async function () {
  const store = this;
  const token = jwt.sign({ _id: store._id.toString() }, process.env.JWT_SECRET);

  store.tokens = store.tokens.concat({ token });
  await store.save();

  return token;
};

shopSchema.statics.findByCredentials = async (email, password) => {
  const store = await Shop.findOne({ email });
  if (!store) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, store.password);
  if (!isMatch) {
    throw new Error('Invalid Credentials');
  }

  return store;
};

shopSchema.pre('save', async function (next) {
  const shop = this;
  if (shop.isModified('password')) {
    shop.password = await bcrypt.hash(shop.password, 8);
  }
  next();
});

const Shop = mongoose.model('Shop', shopSchema);
module.exports = Shop;
