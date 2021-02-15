const express = require("express");
const Item = require("./../models/itemModel");
const router = new express.Router();

router.post("/addItem", async (req, res) => {
  const newItem = new Item(req.body);
  try {
    await newItem.save();
    res.status(201).json({
      status: "success",
      data: {
        item: newItem,
      },
    });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
