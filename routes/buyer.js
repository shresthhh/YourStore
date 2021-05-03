const express = require('express');
const User = require('./../models/userModel');
const Shop = require('./../models/storeModel');
const router = new express.Router();
const auth = require('./../middleware/userAuth');
var ObjectId = require('mongoose').Types.ObjectId;

router.get('/searchShops', async function (req, res) {
  const item = req.query.search;
  let value = 'item';
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
    res.status(400).send(e);
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
    res.status(400).send(e);
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
    res.status(500).send(e);
  }
});

router.post('/user/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send('Logged out from all devices');
  } catch (e) {
    res.status(500).send(e);
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
      console.log(User.address);
      await User.save();
      res.status(201).json({
        status: 'success',
        User,
      });
    } catch (e) {
      res.status(400).send(e);
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
      if (
        item._id == req.params.id &&
        item.quantity - req.params.quantity >= 0
      ) {
        User.cart.forEach((item) => {
          item.quantity = item.quantity + parseInt(req.params.quantity);
        });
      }
    });
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/user/addCart/:id/:quantity', auth, async (req, res) => {
  const User = req.user;
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    }); //change it to search with shop id and then compare each item with object id in request parameters
    shop.items.forEach((e, index) => {
      if (e._id == req.params.id && e.quantity - req.params.quantity >= 0) {
        item = e;
        item.quantity = req.params.quantity;
        User.cart = User.cart.concat(item);
        return;
      }
    });
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).send(e);
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
    res.status(400).send(e);
  }
});

router.post('/user/checkout', auth, async (req, res) => {
  try {
    const User = req.user;
    User.OrderHistory.push(...User.cart);
    User.cart = [];
    await User.save();
    res.status(200).send(User);
  } catch (e) {
    res.status(400).send(e);
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
      const radius = distance/6378.1; //in km
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
      console.log(e);
      res.status(400).send(e);
    }
  }
);

module.exports = router;
