var express = require('express');
var donationRouter = express.Router();
var braintree = require('braintree');
var util = require('util');
var env = require('node-env-file');
/**
 * environment file for developing under a local server
 * comment out before deployment
 */

env(__dirname + '/../.env');

var MERCHANT_ID = process.env.MERCHANTID;
var PUBLIC_KEY = process.env.PUBLICKEY;
var PRIVATE_KEY = process.env.PRIVATEKEY;

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: MERCHANT_ID,
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
});

donationRouter.get('/client_token', function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.send(response.clientToken);
  });
});

donationRouter.post('/checkout', function (req, res) {
  var nonce = req.body.payment_method_nonce;
  var amount = req.body.amount;
  console.log('INSIDE SERVER ', nonce);
  // Use payment method nonce here
  gateway.transaction.sale({
    amount: amount,
    paymentMethodNonce: 'fake-valid-visa-nonce',
  }, function (err, result) {
    if (err) throw err;
    console.log(util.inspect(result));
    res.json(result);
  });
});

module.exports = donationRouter;
