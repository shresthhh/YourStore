const express = require("express");
const User = require("./../models/userModel");
const router = new express.Router();

router.post("/buyer/signup", async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/buyer/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    res.status(200).json(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
