'use strict';

angular.module('spotz', [
'ngCookies',
'ui.router',
'angularPayments',
'spotz.map',
'spotz.login',
'spotz.nav',
'spotz.side',
'spotz.donate'
])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('main', {
        url: '/',

        // Reference: http://slides.com/timkindberg/ui-router#/11/5
        views: {
          '@': {  // unnamed ui-view element thats in the index.html
            templateUrl: '/main/mainDisplay.html',
          },

          //'nav' is the ui-view element named 'nav' thats in 'main' states template (mainDisplay.html)
          'nav@main': { templateUrl: '/navBar/nav.html', controller: 'navCtrl' },
          'side@main': { templateUrl: '/sideBar/sideBar.html', controller: 'sideCtrl' },
          'map@main': { templateUrl: '/map/map.html', controller:'mapCtrl' },
          'donate@main': { templateUrl: '/donate/donate.html', controller:'donateCtrl' },
        },
      })
  .state('login', {
    url: '/login',
    templateUrl: '/authentication/login.html',
    controller: 'loginCtrl',
  })

  $urlRouterProvider.otherwise('/');

});
