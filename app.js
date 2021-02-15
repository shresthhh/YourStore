const express = require("express");
const userRouter = require("./routes/buyer");
const registerShopRouter = require("./routes/shop");
const bodyParser = require("body-parser");

const app = express();

app.use(require("cors")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(userRouter);
app.use(registerShopRouter);

module.exports = app;
