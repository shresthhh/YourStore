const express = require('express');
const userRouter = require('./routes/buyer');

const app = express();
app.use(userRouter);


module.exports = app;
