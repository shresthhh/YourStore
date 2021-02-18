const express = require("express");
const User = require("./../models/userModel");
const router = new express.Router();
const auth = require("./../middleware/userAuth");

router.post("/buyer/signup", async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    const token = await newUser.generateAuthToken();
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
    const token = await user.generateAuthToken();
    res.status(200).json(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  if (!req.user) {
    res.status(401).send("Login");
  } else {
    res.status(201).send(req.user);
  }
});

module.exports = router;
