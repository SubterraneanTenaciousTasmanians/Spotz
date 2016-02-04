var db = require('./../db.js');

module.exports = {
  create: function (userinfo) {
    return new User(userinfo).save().then(function (model) {
      console.log(model, 'user has been saved');
    });
  },

  read: function (userinfo) {
    return new User(userinfo).fetch().then(function (model) {
      console.log(model, 'user has been found');
    }).catch(function (err) {
      console.log(err, 'user does not exist');
    });
  },

  update: function (userinfo) {
    return new User({username: userinfo.username).save({password: userinfo.password}, {patch: true}).then(function(model){
      console.log(model, 'has been updated');
    })
  },

  delete: function (userinfo) {
    new User(userinfo).destroy().then(function (model) {
      console.log(model, 'user has been deleted');
    });
  },
};
