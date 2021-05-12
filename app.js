const express = require('express');
const userRouter = require('./routes/buyer');
const registerStoreRouter = require('./routes/store');
const bodyParser = require('body-parser');

const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});
app.use(require('cors')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(userRouter);
app.use(registerStoreRouter);

module.exports = app;
