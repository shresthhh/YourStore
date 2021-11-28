const express = require('express');
const multer = require('multer');
const User = require('./../models/userModel');
const Shop = require('./../models/storeModel');
const router = new express.Router();
const auth = require('./../middleware/userAuth');
var ObjectId = require('mongoose').Types.ObjectId;
const UploadUserPhoto = require('./../middleware/userUpload');
const _ = require('underscore');

//modules used for verifying email route handler
const SibApiV3Sdk = require('sib-api-v3-sdk');
const jwt = require('jsonwebtoken');

//set api key for email verification
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
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
    let url;
    //set up the secret used for email verification
    const EMAIL_SECRET = process.env.EMAIL_SECRET;
    await newUser.save();
    // const token = await newUser.generateAuthToken();

    //email verification mail sent
    jwt.sign(
      {
        user: _.pick(newUser, 'id'),
      },
      EMAIL_SECRET,
      {
        expiresIn: '1d',
      },
      (err, emailToken) => {
        //building node transporter used for authenticating sender account
        //it uses sendgrid
        url = `https://yourstore-swe.herokuapp.com/user/confirmation/${emailToken}`;

        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        // sendSmtpEmail.subject = 'My {{params.subject}}';
        sendSmtpEmail.sender = {
          name: 'YourStore',
          email: 'testasdf246@gmail.com',
        };

        sendSmtpEmail.to = [{ email: newUser.email, name: newUser.name }];
        sendSmtpEmail.replyTo = {
          email: 'noreply@yourstore.co',
          name: 'YourStore',
        };
        sendSmtpEmail.templateId = 1;
        sendSmtpEmail.params = {
          parameter: 'My param value',
          subject: 'Verify email for yourStore',
          verify_link: url,
          FIRSTNAME: newUser.name,
        };

        apiInstance.sendTransacEmail(sendSmtpEmail).then(
          function (data) {
            console.log(
              'API called successfully. Returned data: ' + JSON.stringify(data)
            );
          },
          function (error) {
            console.error(error);
          }
        );
      }
    );
    res.status(201).json({
      status: 'success',
      data: {
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

router.get('/user/confirmation/:token', async (req, res, next) => {
  try {
    const {
      user: { id },
    } = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
    await User.findByIdAndUpdate(id, { active: true }, { new: true });
    res.status(200).json({
      status: 'success',
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
    });
  }
});

router.post('/user/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    //check if account is email verified
    if (!user.active) {
      throw 'Please verify your email!';
    }
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
  address = {
    location: req.body.address,
    type: req.body.type,
  };
  if (!req.user) {
    res.status(401).send('Login');
  } else {
    try {
      User.address = User.address.concat(address);
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

router.patch(
  '/user/me/update',
  auth,
  UploadUserPhoto,
  async (req, res, next) => {
    try {
      // const filteredBody = filterObj(req.body, 'name', 'email');
      const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json({
        status: 'success',
        data: {
          user: updatedUser,
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

router.delete('/user/delete', auth, async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

router.patch('/user/address', auth, async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          address: { location: req.body.location },
        },
      },
      {
        new: true,
      }
    );
    if (updatedUser) {
      res.status(200).json({
        status: 'success',
        updatedUser,
      });
    } else throw 'Unable to update!';
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
    });
  }
});

router.post('/user/cart/increase/:id/:quantity', auth, async (req, res) => {
  const User = req.user;
  let qty = parseInt(req.params.quantity);
  try {
    const shop = await Shop.findOne({
      items: { $elemMatch: { _id: new ObjectId(req.params.id) } },
    });
    shop.items.forEach((item, index) => {
      if (item._id == req.params.id && item.quantity - qty >= 0) {
        User.cart.forEach(async (userItem) => {
          if (userItem.quantity + qty > item.quantity)
            qty = item.quantity - userItem.quantity;
          if (userItem._id == req.params.id)
            userItem.quantity = userItem.quantity + parseInt(qty);
          if (userItem.quantity <= 0) {
            User.cart.pull(req.params.id);
            if (User.cart.length == 0) User.shopInCart = undefined;
          }
        });
      }
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
          if (item.demand > Store.maxDemand) {
            maxDemand = item.demand;
            Store.trendingItem = item;
          }
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
        shopName: Store.shopName,
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
      shopName: Store.shopName,
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

router.get('/trending', async (req, res, next) => {
  try {
    const stores = await Shop.find();
    const trending = [];
    if (stores == null) throw 'No shops were found!';
    stores.forEach((store) => {
      if (store.trendingItem != null) trending.push(store.trendingItem);
    });
    res.status(200).json({
      status: 'success',
      length: trending.length,
      trending,
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

router.get('/shop/:shopID', async (req, res) => {
  try {
    const store = await Shop.findById(req.params.shopID);
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
router.get('/shops-within/:distance/center/:latlng/', async (req, res) => {
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
});

router.get('/searchItem/:id', async (req, res) => {
  const regex = new RegExp(`${req.query.search}`, 'i');
  const items = [];
  try {
    const store = await Shop.findById(req.params.id);
    if (!store) throw 'Store not found!';
    store.items.forEach((item) => {
      if (regex.test(item.itemName)) items.push(item);
    });
    if (items == null) throw 'No items matched!';
    res.status(200).json({
      status: 'success',
      length: items.length,
      items,
    });
  } catch (e) {
    res.status(400).json({
      status: 'failure',
      error: e.message || e,
    });
  }
});

router.post('/user/requestItem', auth, async (req, res) => {
  try {
    const stores = await Shop.find();
    const check = await Shop.findOne({
      itemsDemanded: { $elemMatch: { prodName: req.body.prodName } },
    });
    if (check) throw 'This item has already been requested!';
    const demand = {
      prodName: req.body.prodName,
      desc: req.body.desc,
      userName: req.user.name,
      phoneNumber: req.user.phone,
      qty: req.body.qty,
    };
    stores.forEach(async (store) => {
      store.itemsDemanded.push(demand);
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
