'use strict';

var mapApp = angular.module('spotz', ['ui.router', 'spotz.map'])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('map', {
      url: '/map',
      templateUrl: '/map/map.html',
      controller: 'mapCtrl',
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login/login.html',
    });

  $urlRouterProvider.otherwise('/map');
});
