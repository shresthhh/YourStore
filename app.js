const express = require("express");
const userRouter = require("./routes/buyer");
const registerStoreRouter = require("./routes/store");
const addItemsRouter = require("./routes/addItems");
const bodyParser = require("body-parser");

const app = express();

app.use(require("cors")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(userRouter);
app.use(registerStoreRouter);
app.use(addItemsRouter);

module.exports = app;
