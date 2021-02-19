const express = require("express");
const Shop = require("../models/storeModel");
const router = new express.Router();
const auth = require("../middleware/storeAuth");

router.post("/store/register", async (req, res) => {
  const newStore = new Shop(req.body);

  try {
    await newStore.save();
    const token = await newStore.generateAuthToken();
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
    const token = await store.generateAuthToken();
    res.status(200).json(store);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/stores/myStore", auth, async (req, res) => {
  if (!req.store) {
    res.status(401).send("Login!");
  } else {
    res.status(200).send(req.store);
  }
});

module.exports = router;
