var fs = require('fs');
var db = require('./db/db.js');

fs.readFile('../streetSweepingH-Z.json', 'utf8', function (err, data) {
  console.log('the data', data);
  data = JSON.parse(data);
  console.log('data end');
  for (var i = 0; i < data.length; i++) {
    console.log('data[i]', data[i]);

    // FORMAT OPT-OUT convert empty string into zero
    if (!data[i]['Opt-out']) {
      data[i]['Opt-out'] = 0;

      // if the number is stringified parse it.
    } else if (typeof data[i]['Opt-out'] === 'string') {
      data[i]['Opt-out'] = parseInt(data[i]['Opt-out']);
    }

    if (!data[i]['Address From']) {
      data[i]['Address From'] = 0;
    }

    if (!data[i]['Address To']) {
      data[i]['Address To'] = 0;
    }

    new db.sweeping(data[i]).save().then(function () {
      console.log('ohyeah');
    });
  }
});
