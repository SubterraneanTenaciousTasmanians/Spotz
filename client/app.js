'use strict';

var mapApp = angular.module('spotz', ['ui.router', 'spotz.map', 'spotz.login'])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('map', {
      url: '/map',
      templateUrl: '/map/map.html',
      controller: 'mapCtrl',
    })
    .state('login', {
      url: '/login',
      templateUrl: '/authentication/login.html',
      controller: 'loginCtrl',
    });

  $urlRouterProvider.otherwise('/login');
});
