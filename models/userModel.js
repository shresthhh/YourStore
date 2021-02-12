const mongoose = require('mongoose');
const validator = require('validator');

const userScema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true,
  },
  lname: {
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
  dob: {
    type: Date,
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
  profilePicture: {
    type: Buffer,
    // required: true,
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
    validate(value) {
      if (value.length != 10) throw new Error('Invalid Number');
    },
  },
});

const User = mongoose.model('User', userScema);
module.exports = User;
