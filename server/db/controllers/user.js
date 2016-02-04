var db = require('./../models/user.js');

module.exports = {
  create: function (userinfo) {
    return new db.User(userinfo).save().then(function (model) {
      console.log(model, 'user has been saved');
      return model;
    });
  },

  read: function (userinfo) {
    return new db.User(userinfo).fetch().then(function (model) {
      console.log(model, 'user has been found');
      return model;
    }).catch(function (err) {
      console.log(err, 'user does not exist');
    });
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
