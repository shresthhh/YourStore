const express = require('express');
const User = require('./../models/userModel');
const router = new express.Router();

module.exports = router.post('/signup', async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (e) {
    console.log(e);
  }
});
