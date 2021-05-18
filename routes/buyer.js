const express = require('express');
const multer = require('multer');
const User = require('./../models/userModel');
const Shop = require('./../models/storeModel');
const router = new express.Router();
const auth = require('./../middleware/userAuth');
var ObjectId = require('mongoose').Types.ObjectId;
const UploadUserPhoto = require('./../middleware/userUpload');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

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
        token,
        user: newUser,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
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
    res.status(201).json({
      status: 'success',
      data: {
        token,
        user,
      },
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
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
      error: e.message || e,
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
      error: e.message || e,
    });
  }
});

router.post('/user/me/addAddress', auth, async (req, res) => {
  const User = req.user;
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
        error: e.message || e,
      });
    }
  }
});

router.get('/user/me', auth, async (req, res) => {
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    res.status(201).send(req.user);
  }
});

router.patch('/user/me/update', auth, UploadUserPhoto, async (req, res, next) => {
  try {

    // const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    })
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
    });
  }
});

router.delete('/user/delete', auth, async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

router.post('/user/cart/increase/:id/:quantity', auth, async (req, res) => {
  const User = req.user;
  let qty = parseInt(req.params.quantity);
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    });
    shop.items.forEach((item, index) => {
      if (item._id == req.params.id && item.quantity - qty >= 0)
        User.cart.forEach(async (userItem) => {
          if (userItem.quantity + qty > item.quantity)
            qty = item.quantity - userItem.quantity;
          userItem.quantity = userItem.quantity + parseInt(qty);
          if (userItem.quantity <= 0) {
            User.cart.pull(req.params.id);
            User.shopInCart = undefined;
          }
        });
    });
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
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
      status: 'failure',
      error: e.message || e,
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
      error: e.message || e,
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
          if (item.quantity < e.quantity)
            throw 'Not sufficient item! ' + item.itemName + ' not in stock';
          item.quantity -= e.quantity;
          Store.totalItemsSold += 1;
        }
      });
      e.status = 'TBD';
    });
    const delivery = {
      _id: uniqueID,
      user: {
        userID: req.user.id,
        address: req.body.address,
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
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
      order: Order,
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
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
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: 'Could not retreive payments!' || e,
    });
  }
});

router.get('/shop', auth, async (req, res) => {
  try {
    const store = await Shop.findById(req.body.shopID);
    store.totalClicks += 1;
    await store.save();
    res.status(200).json({
      status: 'success',
      data: store,
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: 'Could not retreive store!' || e,
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
        throw 'Location points not given properly';
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
        error: e.message || e,
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
      status: 'failure',
      error: e || e.message,
    });
  }
});

module.exports = router;
