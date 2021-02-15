const express = require("express");
const Shop = require("./../models/shopModel");
const router = new express.Router();
const auth = require("./../middleware/shopAuth");

router.post("/registerShop", async (req, res) => {
  const newShop = new Shop(req.body);

  try {
    await newShop.save();
    res.status(201).json({
      status: "success",
      data: {
        Shop: newShop,
      },
    });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
