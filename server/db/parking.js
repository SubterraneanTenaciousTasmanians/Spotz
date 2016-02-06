var db = require('./db.js');

//model from schema
db.WorldGrid = db.Model.extend({
  tableName: 'worldGrid',
});

db.PermitZones = db.Model.extend({
  tableName: 'permitZones',
});

db.PermitRules = db.Model.extend({
  tableName: 'permitRules',
});
