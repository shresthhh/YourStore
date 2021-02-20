const express = require("express");
const Shop = require("../models/storeModel");
const Item = require("./../models/itemModel");
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

router.post("/store/logout", auth, async (req, res) => {
  try {
    req.store.tokens = req.store.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.store.save();
    res.status(200).send("Logged out successfully");
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/store/logoutAll", auth, async (req, res) => {
  try {
    req.store.tokens = [];
    req.store.save();
    res.status(200).send("Logged out from all devices");
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/stores/myStore/addItem", auth, async (req, res) => {
  const store = req.store;
  try {
    const newItem = await new Item(req.body);
    store.items = store.items.concat({ item: newItem });
    await store.save();
    res.status(200).send(store);
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

router.get("/stores/myStore/myProducts", auth, async (req, res) => {
  if (!req.store) {
    res.status(401).send("Login!");
  } else {
    const myProducts = [];
    try {
      req.store.items.forEach((item) => {
        myProducts.push(item);
      });
      res.status(200).send(myProducts);
    } catch (e) {
      res.status(400).send(e);
    }
  }
});

module.exports = router;
