var express = require('express');
var donationRouter = express.Router();
var util = require('util');
var env = require('node-env-file');
/**
 * environment file for developing under a local server
 * comment out before deployment
 */

env(__dirname + '/../.env');

var SECRET_KEY = process.env.SECRETKEY;

var stripe = require('stripe')(SECRET_KEY);

donationRouter.post('/donate', function (req, res) {
  var stripeToken = req.body.token;
  var amount = req.body.amount;
  console.log("REQUEST BODY", req.body);
  stripe.charges.create({
    card: stripeToken,
    currency: 'usd',
    amount: amount,
  }, function (err, charge) {
    if (err) {
      res.status(501).send(err);
    } else {
      console.log('CHARGEEED', charge)
      res.status(204).send(charge);
    }
  });
});

module.exports = donationRouter;
