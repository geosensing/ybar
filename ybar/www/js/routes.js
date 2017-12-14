angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider



      .state('menu.profile', {
    url: '/profile',
    views: {
      'side-menu21': {
        templateUrl: 'templates/profile.html',
        controller: 'profileCtrl'
      }
    }
  })

  .state('menu', {
    url: '/menu',
    templateUrl: 'templates/menu.html',
    abstract:true,
    controller: 'menuCtrl'
  })


  .state('landing', {
    url: '/landing',
    templateUrl: 'templates/landing.html',
    controller: 'landingCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('loginfb', {
    url: '/loginfb',
    templateUrl: 'templates/facebook.html',
    controller: 'loginCtrl'
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'signupCtrl'
  })

  .state('menu.findJobs', {
    url: '/findJobs',
    views: {
      'side-menu21': {
        templateUrl: 'templates/findJobs.html',
        controller: 'findJobsCtrl'
      }
    }
  })

  .state('menu.job', {
    url: '/job/:job_id',
    views: {
      'side-menu21': {
        templateUrl: 'templates/job.html',
        controller: 'jobCtrl'
      }
    }
  })

  .state('menu.task', {
    url: '/taskList/:job_id/:task_id',
    views: {
      'side-menu21': {
        templateUrl: 'templates/taskList.html',
        controller: 'taskListCtrl'
      }
    }
  })

  .state('menu.myJobs', {
    url: '/myJobs',
    views: {
      'side-menu21': {
        templateUrl: 'templates/myJobs.html',
        controller: 'myJobsCtrl'
      }
    }
  })

  .state('menu.myTasks', {
    url: '/myTasks/:job_id',
    views: {
      'side-menu21': {
        templateUrl: 'templates/myTasks.html',
        controller: 'myTasksCtrl'
      }
    }
  })


  .state('menu.doTask', {
    url: '/doTask/:task_id',
    views: {
      'side-menu21': {
        templateUrl: 'templates/doTask.html',
        controller: 'doTaskCtrl'
      }
    }
  })

  .state('resetPassword', {
    url: '/resetPassword',
    templateUrl: 'templates/resetPassword.html',
    controller: 'resetPasswordCtrl'
  })

$urlRouterProvider.otherwise('/landing')



});
