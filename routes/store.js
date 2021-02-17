const express = require("express");
const Shop = require("../models/storeModel");
const router = new express.Router();
const auth = require("../middleware/storeAuth");

router.post("/store/register", async (req, res) => {
  const newStore = new Shop(req.body);

  try {
    await newStore.save();
    res.status(201).json({
      status: "success",
      data: {
        Shop: newStore,
      },
    });
  } catch (e) {
    console.log(e);
  }
});

router.post("/store/login", async (req, res) => {
  try {
    const store = await Shop.findByCredentials(
      req.body.email,
      req.body.password
    );
    res.status(200).json(store);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
