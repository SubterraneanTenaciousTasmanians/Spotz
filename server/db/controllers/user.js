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
      if (!model) {
        console.log('user does not exist');
        return model;
      } else {
        console.log(model, 'user has been found');
        return model;
      }
    });
  },

  update: function (userinfo) {
    db.knex('users')
      .where({ username: userinfo.username })
      .update({ password:userinfo.password })
      .then(function (model) {
        console.log('Model has been updated');
      });
  },

  delete: function (userinfo) {
    return this.read(userinfo).then(function (model) {
      new db.User({ id: model.id }).destroy().then(function (model) {
        console.log(model, 'user has been deleted');
      });
    });

  },
};
