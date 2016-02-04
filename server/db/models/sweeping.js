var db = require('./../db.js');

db.sweeping = db.Model.extend({
  tableName: 'streetSweeping',
});
