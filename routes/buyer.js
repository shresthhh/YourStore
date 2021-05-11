const express = require('express');
const User = require('./../models/userModel');
const Shop = require('./../models/storeModel');
const router = new express.Router();
const auth = require('./../middleware/userAuth');
var ObjectId = require('mongoose').Types.ObjectId;

router.get('/searchShops', async function (req, res) {
  const item = req.query.search;
  let items = await Shop.find({
    items: { $elemMatch: { itemName: { $regex: item, $options: 'i' } } },
  });
  let shops = await Shop.find({ shopName: { $regex: item, $options: 'i' } });
  res.status(200).json({
    status: 'success',
    data: {
      shopData: {
        length: shops.length,
        shops,
      },
      itemsData: {
        length: items.length,
        items,
      },
    },
  });
});

router.post('/user/signup', async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    const token = await newUser.generateAuthToken();
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.post('/user/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.status(200).json(user);
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.post('/user/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.status(200).send('Logged out successfully');
  } catch (e) {
    res.status(500).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.post('/user/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send('Logged out from all devices');
  } catch (e) {
    res.status(500).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.post('/users/me/addAddress', auth, async (req, res) => {
  const User = req.user;
  console.log(req.user);
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    try {
      User.address = User.address.concat(req.body.address);
      await User.save();
      res.status(201).json({
        status: 'success',
        User,
      });
    } catch (e) {
      res.status(400).json({
        status: 'failure',
        message: e.message,
      });
    }
  }
});

router.get('/users/me', auth, async (req, res) => {
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    res.status(201).send(req.user);
  }
});

router.post('/user/cart/increase/:id/:quantity', auth, async (req, res) => {
  const User = req.user;
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    });
    shop.items.forEach((item, index) => {
      if (item._id == req.params.id && item.quantity - req.params.quantity >= 0)
        User.cart.forEach(async (item) => {
          item.quantity = item.quantity + parseInt(req.params.quantity);
          if(item.quantity<=0)
            User.cart.pull(req.params.id);
        });
    });
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.post('/user/addCart/:id/:quantity', auth, async (req, res) => {
  const User = req.user;
  let qty;
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    }); //change it to search with shop id and then compare each item with object id in request parameters
    shop.items.forEach((e, index) => {
      qty = e.quantity;
      if (e._id == req.params.id) {
        if (
          JSON.stringify(User.shopInCart) &&
          JSON.stringify(e.shopID) != JSON.stringify(User.shopInCart)
        )
          throw 'You can add items only from one shop!';
        if (e.quantity - req.params.quantity >= 0) {
          item = e;
          item.quantity = req.params.quantity;
          User.cart = User.cart.concat(item);
          return;
        } else throw 'Item not in stock!';
      }
    });
    User.shopInCart = shop._id;
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).json({
      status: 'failed',
      error: e.message,
      quantity: qty,
    });
  }
});

router.get('/user/Cart', auth, async (req, res) => {
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    res.status(201).send(req.user.cart);
  }
});

router.get('/user/Wishlist', auth, async (req, res) => {
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    res.status(201).send(req.user.wishlist);
  }
});

router.post('/user/addWishlist/:id', auth, async (req, res) => {
  const User = req.user;
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    }); //change it to search with shop id and then compare each item with object id in request parameters
    shop.items.forEach((e, index) => {
      if (e._id == req.params.id && e.quantity > 0) item = e;
    });
    User.wishlist = User.wishlist.concat(item);
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      message: e.message,
    });
  }
});

//when user checksout, need total bill amount in request body
router.post('/user/checkout', auth, async (req, res) => {
  try {
    const User = req.user;
    const bill = req.body.cost;
    const Store = await Shop.findById(User.shopInCart);
    let uniqueID = new ObjectId(); //this is unique transaction ID used to distinguish orders
    User.cart.forEach((e) => {
      Store.items.forEach((item) => {
        if (JSON.stringify(item._id) == JSON.stringify(e._id)) {
          item.demand += 1;
        }
      });
      e.status = 'TBD';
    });
    const delivery = {
      _id: uniqueID,
      user: {
        userID: req.user.id,
        address: req.body.address,
        items: [],
      },
    };
    const Order = {
      _id: uniqueID,
      order: {
        totalCost: bill,
        shopID: Store._id,
        address: req.body.address,
        items: [],
      },
    };
    delivery.user.items.push(...User.cart);
    Store.delivery.push(delivery);
    Order.order.items.push(...User.cart);
    User.PendingOrders.push(Order);
    User.cart = [];
    User.shopInCart = undefined;
    Store.profitsDaily = Store.profitsDaily + bill;
    Store.profitsMonthly = Store.profitsMonthly + bill;
    Store.profitsYearly = Store.profitsYearly + bill;
    const payments = {
      totalCost: bill,
      date: new Date(Date.now()).toISOString(),
      shopID: Store._id,
    };
    User.paymentHistory.push(payments);
    await User.save();
    await Store.save();
    res.status(200).send({
      status: 'success',
      order: Order
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      message: e.message,
    });
  }
});

router.get('/user/paymentHistory', auth, async (req, res) => {
  try {
    const payments = req.user.paymentHistory;
    res.status(200).json({
      status: 'success',
      data: payments,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'Could not retreive payments!',
    });
  }
});

router.get('/shop', auth, async (req, res) => {
  try {
    const store = await Shop.findById(req.body.shopID);
    res.status(200).json({
      status: 'success',
      data: store,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: 'Could not retreive store!',
    });
  }
});

//  /shops-within/233/center/-40,45
router.get(
  '/shops-within/:distance/center/:latlng/',
  auth,
  async (req, res) => {
    try {
      const { distance, latlng, unit } = req.params;
      const [lat, lng] = latlng.split(',');
      const radius = distance / 6378.1; //in km
      if (!lat || !lng) {
        throw new Error('Location points not given properly');
      }
      const shops = await Shop.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
      });
      res.status(200).json({
        status: 'success',
        results: shops.length,
        data: {
          data: shops,
        },
      });
    } catch (e) {
      res.status(400).json({
        status: 'failure',
        message: e.message,
      });
    }
  }
);

router.post('/user/requestItem', auth, async (req, res) => {
  try {
    const stores = await Shop.find();
    const check = await Shop.findOne({
      itemsDemanded: { $elemMatch: { name: req.body.name } },
    });
    if (check) throw 'This item has already been requested!';
    stores.forEach(async (store) => {
      store.itemsDemanded.push(req.body);
      await store.save();
    });
    res.status(201).send({
      status: 'success',
      message:
        'Items requested were successfully broadcasted to nearby shopkeepers!',
    });
  } catch (e) {
    res.status(400).send({
      status: 'error',
      message: e,
    });
  }
});

module.exports = router;
