'use strict';

var mapApp = angular.module('spotz', ['ngCookies', 'ui.router', 'angularPayments', 'spotz.map', 'spotz.login', 'spotz.donation'])

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
    })
    .state('signup', {
      url: '/signup',
      templateUrl: '/authentication/signup.html',
      controller: 'loginCtrl',
    })
    .state('donate', {
      url: '/donate',
      templateUrl: '/donation/donation.html',
      controller: 'donateCtrl',
    });
  $urlRouterProvider.otherwise('/login');
});
