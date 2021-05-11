const express = require('express');
const Shop = require('./../models/storeModel');
const Item = require('./../models/itemModel');
const User = require('./../models/userModel');
const router = new express.Router();
const auth = require('../middleware/storeAuth');
var ObjectId = require('mongoose').Types.ObjectId;
const mongoose = require('mongoose');

router.post('/store/register', async (req, res) => {
  const newStore = new Shop(req.body);

  try {
    await newStore.save();
    const token = await newStore.generateAuthToken();
    res.status(201).json({
      status: 'success',
      data: {
        Shop: newStore,
      },
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/store/login', async (req, res) => {
  try {
    const store = await Shop.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await store.generateAuthToken();
    res.status(200).json({
      data: {
        Shop: store,
      },
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/store/logout', auth, async (req, res) => {
  try {
    req.store.tokens = req.store.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.store.save();
    res.status(200).send('Logged out successfully');
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/store/logoutAll', auth, async (req, res) => {
  try {
    req.store.tokens = [];
    req.store.save();
    res.status(200).send('Logged out from all devices');
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/myStore/addItem', auth, async (req, res) => {
  const store = req.store;
  try {
    const newItem = await new Item(req.body);
    store.items = store.items.concat(newItem);
    await store.save();
    res.status(200).send(store);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/myStore/itemsToDeliver', auth, async (req, res) => {
  const store = req.store;
  try {
    const newItem = await new Item(req.body);
    store.delivery = store.delivery.concat(newItem);
    await store.save();
    res.status(200).send(store);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/stores/myStore', auth, async (req, res) => {
  if (!req.store) {
    res.status(401).send('Login!');
  } else {
    res.status(200).send(req.store);
  }
});

router.get('/myProducts', auth, async (req, res) => {
  if (!req.store) {
    res.status(401).send('Login!');
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

router.post('/store/delivered', auth, async (req, res) => {
  try {
    const reqOrder = req.body.orderID;
    const store = req.store;
    const user = await User.findById(req.body.userID);
    user.PendingOrders.forEach((order) => {
      if (order._id.toString() == reqOrder) {
        user.OrderHistory.push(order);
        user.PendingOrders.pull(order._id);
        store.delivery.forEarch((deliverable) => {
          if (deliverable.user.userID.equals(user._id))
            store.deliveryHistory.push(deliverable);
        });
        store.delivery.pull(user._id);
      }
    });
    await user.save();
    res.status(200).json({
      status: 'success',
    });
  } catch (e) {
    res.status(400).json({
      status: 'fail',
      message: e.message,
    });
  }
});

router.patch('/myProducts/:id', auth, async (req, res) => {
  let x = {};
  for (const [key, value] of Object.entries(req.body)) {
    let temp = 'items.$.'.concat(key);
    x[temp] = value;
  }
  try {
    const product = await Shop.updateOne(
      { 'items._id': req.params.id },
      {
        $set: x,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).send('Item not found');
    }
    res.status(200).send(product);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.patch('/myProducts/delete/:id', auth, async (req, res) => {
  Shop.updateOne(
    { _id: new ObjectId(req.store._id) },
    {
      $pull: {
        items: { _id: new ObjectId(req.params.id) },
      },
    },
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'error in deleting item' });
      }
      res.json(data);
    }
  );
});

module.exports = router;
