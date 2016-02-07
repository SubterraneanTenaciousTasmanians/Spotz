var db = require('./db.js');

//model from schema
db.User = db.Model.extend({
  tableName: 'users',
});

//accessing functions
module.exports = {
  create: function (userinfo) {
    return new db.User(userinfo).save().then(function (model) {
      console.log(model, 'user has been saved');
      return model;
    });
  },

  read: function (userinfo) {
    return new db.User(userinfo).fetch().then(function (model) {
      if (!model) {
        console.log('user does not exist');
        return model;
      } else {
        console.log(model, 'user has been found');
        return model;
      }
    });

    // .catch(function (err) {
    // });
  },

  //NOTE: Update function does not work, need to be fixed
  update: function (userinfo) {
    return new db.User({ username: userinfo.username })
      .save({ password: userinfo.password }, { patch: true })
      .then(function (model) {
      console.log(model, 'has been updated');
    });
  },

  delete: function (userinfo) {
    this.read(userinfo).then(function (model) {
      new db.User({ id: model.id }).destroy().then(function (model) {
        console.log(model, 'user has been deleted');
      });
    });

  },
};
