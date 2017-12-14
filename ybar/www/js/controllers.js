var ybardata = {
  "user" : null,
  "storedtasks" : []
}

angular.module('app.controllers', [])

.controller('profileCtrl', ['$scope', '$stateParams', '$http', 'APIService', 'DataStoreService',// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, APIService, DataStoreService) {
  $scope.userProfile = {"gender":"","phone":"","streetAddress":"", "state":"","country":""};
  $scope.user = DataStoreService.getLogin().user;
  var cookie = DataStoreService.getLogin().cookie;
  $http({method: 'GET', url: ybarURL + "/api/user/get_user_meta", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
  then(function (response) {
    console.log(response);
    if (response.data.age) {
      $scope.userProfile.age = response.data.age;
    }
    if (response.data.gender) {
      $scope.userProfile.gender = response.data.gender;
    }
    if (response.data.phone) {
      $scope.userProfile.phone = response.data.phone;
    }
    if (response.data.streetAddress) {
      $scope.userProfile.streetAddress = response.data.streetAddress;
    }
    if (response.data.city) {
      $scope.userProfile.city = response.data.city;
    }
    if (response.data.state) {
      $scope.userProfile.state = response.data.state;
    }
    if (response.data.country) {
      $scope.userProfile.country = response.data.country;
    }
    if (response.data.postal_code) {
      $scope.userProfile.postalCode = response.data.postal_code;
    }

  }, function () {

  })
  $scope.saveProfile = function () {
    $http({method: 'GET', url: ybarURL + "/api/user/update_user_meta_vars", params: {"cookie":cookie, "insecure":"cool", "gender":$scope.userProfile.gender,"age":$scope.userProfile.age,"phone":$scope.userProfile.phone,"streetAddress":$scope.userProfile.streetAddress,"city":$scope.userProfile.city,"state":$scope.userProfile.state,"country":$scope.userProfile.country,"postal_code":$scope.userProfile.postalCode}, cache: false}).
    then(function (response) {
      console.log(response);
    }, function () {

    })
  }
}])

.controller('loginCtrl', ['$scope', '$stateParams', '$state', '$cordovaFile', '$cordovaDevice', '$http', 'APIService', 'DataStoreService',// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, $cordovaFile, $cordovaDevice, $http, APIService, DataStoreService) {

  $scope.loader = false;

  if (DataStoreService.getLogin()) {
    $state.go('menu.findJobs');
  }
  var device = $cordovaDevice.getDevice();
  var deviceID = device.uuid;
  // var deviceID = "device.uuid";
  $scope.user = {}
  $scope.login = function () {
    $scope.loader = true;
    APIService.nonce('user', 'generate_auth_cookie').then(
      function (response) {
        APIService.login($scope.user.username, $scope.user.password, response.data.nonce, deviceID).then(
          function (response) {
            window.loadMapsApi();
            if (response.data.status == 'ok') {
              var user = response.data;
              DataStoreService.setLogin(response.data)
              var cookie = DataStoreService.getLogin().cookie;
              $http({method: 'GET', url: ybarURL + "/api/list_all_jobs", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
              then(
                function (response) {
                  ybardata.user = user;
                  DataStoreService.setJobList(response.data.jobs);
                  $cordovaFile.writeFile(cordova.file.dataDirectory, "ybardata.json", JSON.stringify(ybardata), true)
                  .then(function (success) {
                    $state.go('menu.findJobs');
                    $scope.loader = false;
                  }, function (error) {
                    console.log("USER  DATA NOT STORED");
                    console.log(error);
                  });
                },
                function () {

                }
              )
            }else if (response.data.status == 'error') {
              $scope.loginError = response.data.error;
              $scope.loader = false;
            }
          },
          function () {
            $scope.loader = false;
            $scope.loginError = "Check your internet connection and try again.";
          }
        )
      },
      function () {
        $scope.loader = false;
        $scope.loginError = "Check your internet connection and try again.";
      }
    )
  }
}])

.controller('signupCtrl', ['$scope', '$stateParams', '$http', '$state', '$cordovaDevice', '$ionicLoading',// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, $state, $cordovaDevice, $ionicLoading) {
  var device = $cordovaDevice.getDevice();
  var deviceID = device.uuid;
  // var deviceID = "device.uuid";
  $scope.loader = false;
  $scope.user={};
  $scope.adduser = function(){
        if(($scope.user.password == $scope.user.repassword)){
            $scope.loader = true;
            $http({method: 'GET', url: ybarURL + "/api/get_nonce", params: {"controller":"user","method":"register"}, cache: false}).
            then(
                function(response) {
                  console.log(response);
                    if(response.data.status == "ok"){
                      console.log("NONCE");
                      console.log(response.data.nonce);
                        $http({method: 'GET', url: ybarURL + "/api/user/register/", params: {"insecure":"cool","uuid":deviceID,"username":$scope.user.email,"email":$scope.user.email,"nonce":response.data.nonce,"display_name":$scope.user.fullname,"user_pass":$scope.user.password}, cache: false}).
                        then(
                            function(response) {
                                console.log("GOT REGISTER RESPONSE");
                                console.log(JSON.stringify(response.data));
                                if(response.data.status == "ok"){
                                    // $ionicLoading.hide()
                                    $scope.loader = false;
                                    $scope.signupError = "Sign up successful. Go to login page to continue.";
                                }else{
                                    console.log(JSON.stringify(response));
                                    // $ionicLoading.hide()
                                    $scope.loader = false;
                                    $scope.signupError = response.data.error;
                                }
                            },
                            function(response) {
                                console.log(JSON.stringify(response));
                                $scope.signupError = response.data.error;
                            });
                    }else{
                        // $ionicLoading.hide()
                        $scope.signupError = response.data.error;
                        $scope.loader = false;
                    }
                },
                function(response) {
                    // $ionicLoading.hide()
                    console.log(response);
                    $scope.loader = false;
                    $scope.signupError = response.data.error;
                });
        }else{
            $scope.loader = false;
            $scope.user.password= '';
            $scope.user.repassword = '';
            $scope.signupError = "";
        }
    }
}])

.controller('findJobsCtrl', ['$scope', '$stateParams', '$http', 'DataStoreService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, DataStoreService) {
  $scope.jobs = []
  var cookie = DataStoreService.getLogin().cookie;
  $http({method: 'GET', url: ybarURL + "/api/list_active_jobs", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      console.log(response);
      $scope.jobs = response.data.jobs;
    },
    function () {

    }
  )
}])

.controller('jobCtrl', ['$scope', '$stateParams', '$http',  '$ionicSlideBoxDelegate', 'DataStoreService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, $ionicSlideBoxDelegate, DataStoreService) {
  var job_id = $stateParams.job_id;
  $scope.job = DataStoreService.getJob(job_id);
  var cookie = DataStoreService.getLogin().cookie;
  $scope.tasks = [];

  $http({method: 'GET', url: ybarURL + "/api/get_client", params: {"cookie":cookie, "client_id":$scope.job.client_id, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      console.log(response);
      $scope.client = response.data.client;
    },
    function () {

    }
  )

  $http({method: 'GET', url: ybarURL + "/api/list_tasks", params: {"cookie":cookie, "job_id":job_id, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      console.log(response);
      for (var i = 0; i < response.data.tasks.length; i++) {
        console.log(response.data.tasks[i]);
        var t = response.data.tasks[i].end_date.split(/[- :]/);
        response.data.tasks[i].end_date = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
        $scope.tasks.push(response.data.tasks[i]);
      }
      DataStoreService.setJobTasks(job_id, $scope.tasks)
      $ionicSlideBoxDelegate.update();
    },
    function () {

    }
  )
}])



.controller('taskListCtrl', ['$scope', '$stateParams', '$http', '$state', '$rootScope', 'DataStoreService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, $state, $rootScope, DataStoreService) {

  // if ($ionicHistory.forwardView()) {
  //   console.log("RELOADING RELOADING RELOADING");
  //   $state.reload();
  // }

  $scope.showMap = true;

  var job_id = $stateParams.job_id;
  var task_id = $stateParams.task_id;
  var cookie = DataStoreService.getLogin().cookie;

  $scope.newmessage = {text:""};
  $scope.sendMessage = function () {
    console.log($scope.newmessage);
    $http({method: 'GET', url: ybarURL + "/api/user/send_message", params: {"cookie":cookie, "insecure":"cool", "message":$scope.newmessage.text, "task_id": task_id}, cache: false}).
    then(
      function (response) {
        console.log(response);
        $scope.newmessage = "";
        get_messages()
      },
      function () {

      }
    )
  }
  $scope.messages = [];
  function get_messages() {
    $http({method: 'GET', url: ybarURL + "/api/user/get_messages", params: {"cookie":cookie, "insecure":"cool", "task_id": task_id}, cache: false}).
    then(
      function (response) {
        console.log(response);
        $scope.messages = response.data.messages;
      },
      function () {

      }
    )
  }

  get_messages();

  var PlacesInit = function (pyrmont) {

  $scope.map = new google.maps.Map(document.getElementById('map'), {
    center: pyrmont,
    zoom: 15,
    streetViewControl: false,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    rotateControl: false,
    fullscreenControl: false
  });

  var marker = new google.maps.Marker({
    map: $scope.map,
    position: pyrmont
  });
   var infowindow = new google.maps.InfoWindow();
   var service = new google.maps.places.PlacesService($scope.map);
 }
  $scope.job = DataStoreService.getJob(job_id);
  $scope.task = null;
  for (var i = 0; i < $scope.job.tasks.length; i++) {
    if ($scope.job.tasks[i].id == task_id) {
      $scope.task = $scope.job.tasks[i];
      $scope.task.showFullAddress = false;
      console.log($scope.task);
      $http({method: 'GET', url: "https://maps.googleapis.com/maps/api/place/details/json", params: {"placeid":$scope.task.location, "key":googleapikey}, cache: false}).
      then(
        function (response) {
          $scope.task.address = response.data.result.formatted_address;
          PlacesInit(response.data.result.geometry.location);
          console.log($scope.task.end_date);
          var t = $scope.task.end_date.toTimeString().split(" ");
          $scope.task.end_date = new Date($scope.task.end_date);
          $scope.task.end_time = t[0];
          console.log(t);
        },
        function () {

        }
      )
      console.log($scope.task);
    }
  }
  var cookie = DataStoreService.getLogin().cookie;
  $scope.acceptTask = function (when) {
    $http({method: 'GET', url: ybarURL + "/api/accept_task", params: {"cookie":cookie, "job_id":job_id, "task_id":task_id, "insecure":"cool"}, cache: false}).
    then(
      function (response) {
        console.log(response);
        if (when == 'now') {
          $state.go('menu.doTask',{'task_id':response.data.result.id});
        }else if ('later') {

        }
      },
      function () {

      }
    )
  }
  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams){
        console.log("STATE CHANGE");
        $scope.showMap = false;
    }
  )
}])


.controller('myJobsCtrl', ['$scope', '$stateParams', '$http', 'DataStoreService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, DataStoreService) {
  $scope.jobs = [];
  $scope.loader = true;
  var cookie = DataStoreService.getLogin().cookie;
  $http({method: 'GET', url: ybarURL + "/api/get_accepted_tasks", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      console.log(response);
      var temp = [];
      $scope.loader = false;
      for (var i = 0; i < response.data.tasks.length; i++) {
        if (temp.indexOf(response.data.tasks[i].job_id) == -1) {
          temp.push(response.data.tasks[i].job_id);
          var job = DataStoreService.getJob(response.data.tasks[i].job_id);
          job.pendingTasks = 0;
          if (job) {
            $scope.jobs.push(job);
          }
        }
        for (var j = 0; j < $scope.jobs.length; j++) {
          if (($scope.jobs[j].id == response.data.tasks[i].job_id) && (response.data.tasks[i].task_status == 'pending')) {
            console.log(response.data.tasks[i]);
            $scope.jobs[j].pendingTasks++;
          }
        }
      }
      console.log($scope.jobs);
    },
    function () {

    }
  )
}])



.controller('myTasksCtrl', ['$scope', '$stateParams', '$http', 'DataStoreService', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $http, DataStoreService) {
  $scope.loader = true;
  var job_id = $stateParams.job_id;
  $scope.tasks = [];
  var cookie = DataStoreService.getLogin().cookie;
  $http({method: 'GET', url: ybarURL + "/api/list_tasks", params: {"cookie":cookie, "job_id":job_id, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      var tasks = response.data.tasks
      $http({method: 'GET', url: ybarURL + "/api/get_accepted_tasks", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
      then(
        function (response) {
          $scope.loader = false;
          for (var i = 0; i < response.data.tasks.length; i++) {
            if (response.data.tasks[i].job_id == job_id) {
              for (var j = 0; j < tasks.length; j++) {
                if (tasks[j].id == response.data.tasks[i].task_id) {
                  response.data.tasks[i].title = tasks[j].title;
                  response.data.tasks[i].image = tasks[j].image;
                }
              }
              $scope.tasks.push(response.data.tasks[i]);
            }
          }
        },
        function () {

        }
      )
    },
    function () {

    }
  )
}])



.controller('doTaskCtrl', ['$scope', '$stateParams', '$rootScope', '$http', '$cordovaCapture', '$cordovaDeviceMotion', '$cordovaGeolocation', '$cordovaDeviceOrientation', '$cordovaDevice', '$cordovaFile', '$sce', '$ionicLoading', '$state', 'DataStoreService', 'SocketService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $rootScope, $http, $cordovaCapture, $cordovaDeviceMotion, $cordovaGeolocation, $cordovaDeviceOrientation, $cordovaDevice, $cordovaFile, $sce,  $ionicLoading, $state, DataStoreService, SocketService) {

  var device = $cordovaDevice.getDevice();
  $scope.deviceID = device.uuid;
  $scope.storedTask = false;
  console.log("DEVICE ID");
  console.log($scope.deviceID);
  // var deviceID = "device.uuid";
  $scope.inRange = 'false';
  $scope.taskData = {};
  function StoreTaskData() {
    $scope.taskData.sensor = $scope.sensor;
    $scope.taskData.user_task_id = $scope.task.user_task.id;
    $scope.taskData.job_task_id = $scope.task.task.id;
    $scope.taskData.user = DataStoreService.getLogin().user;
    $scope.taskData.lat = $scope.currentLocation.lat;
    $scope.taskData.lng = $scope.currentLocation.lng;
    ybardata.storedtasks.push($scope.taskData);
    $cordovaFile.writeFile(cordova.file.dataDirectory, "ybardata.json", JSON.stringify(ybardata), true)
    .then(function (success) {
      console.log("Data Stored");
    }, function (error) {
      console.log("USER  DATA NOT STORED");
      console.log(error);
    });

  }
  function MapsInit(startPos, endPos) {
    console.log("MAP FUNCTION");
    console.log(startPos.lat + "::" + startPos.lng);
    var directionsDisplay;
    var directionsService = new google.maps.DirectionsService();
    var map;

    function initialize() {
      directionsDisplay = new google.maps.DirectionsRenderer();
      var chicago = new google.maps.LatLng(startPos.lat, startPos.lng);
      var mapOptions = {
        zoom:7,
        center: chicago
      }
      map = new google.maps.Map(document.getElementById('mapDoTask'), mapOptions);
      directionsDisplay.setMap(map);
    }

    initialize();

    function calcRoute() {
      var start =  new google.maps.LatLng(startPos.lat, startPos.lng);

      var end = new google.maps.LatLng(endPos.lat, endPos.lng);
      var request = {
        origin: start,
        destination: end,
        travelMode: 'WALKING'
      };
      directionsService.route(request, function(result, status) {
        if (status == 'OK') {
          directionsDisplay.setDirections(result);
          $scope.$apply(function () {
            $scope.distance = result.routes[0].legs[0].distance;
            if ($scope.distance.value < $scope.task.task.location_restriction) {
              $scope.inRange = 'true';
            }
          });
          console.log($scope.distance);
          console.log($scope.task.task.location_restriction);
        }
      });
    }
    calcRoute();
  }
  console.log("Inside DO Job Controller");

  $scope.event = "No Event";


  $scope.currentOrientation = function () {
    $scope.event = "Current Orientation";
    $scope.orientation = {magneticHeading : null, trueHeading: null, accuracy: null, timeStamp: null}
    $cordovaDeviceOrientation.getCurrentHeading().then(function(result) {
      $scope.taskData.currentOrientation = {status: 'true',magneticHeading : result.magneticHeading, trueHeading : result.trueHeading, accuracy : result.headingAccuracy, timeStamp : result.timestamp};
      $scope.orientation.magneticHeading = result.magneticHeading;
      $scope.orientation.trueHeading = result.trueHeading;
      $scope.orientation.accuracy = result.headingAccuracy;
      $scope.orientation.timeStamp = result.timestamp;
      StoreTaskData();
    }, function(err) {
      // An error occurred
    });
  }


  $scope.watchOrientation = function () {
    $scope.event = "Watch Orientation";
    $scope.orientation = {magneticHeading : null, trueHeading: null, accuracy: null, timeStamp: null}
    var options = {
      frequency: 3000,
      filter: true     // if frequency is set, filter is ignored
    }
    $scope.taskData.watchOrientation = {status: 'true',data:[]};
    var watch = $cordovaDeviceOrientation.watchHeading(options).then(
      null,
      function(error) {
        // An error occurred
      },
      function(result) {   // updates constantly (depending on frequency value)
        $scope.taskData.watchOrientation.data.push({magneticHeading : result.magneticHeading, trueHeading : result.trueHeading, accuracy : result.headingAccuracy, timeStamp : result.timestamp});
        $scope.orientation.magneticHeading = result.magneticHeading;
        $scope.orientation.trueHeading = result.trueHeading;
        $scope.orientation.accuracy = result.headingAccuracy;
        $scope.orientation.timeStamp = result.timestamp;
      });
  }


  $scope.stopWatchOrientation = function () {
    $cordovaDeviceOrientation.clearWatch(watch)
      .then(function(result) {
        StoreTaskData();
      }, function(err) {
        // An error occurred
      });
  }


  $scope.currentLocation = function () {
    $scope.event = "Getting Current Locaton";
    $scope.location = {lat: null, long: null};
    var posOptions = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        $scope.taskData.currentAcceleration = {status: 'true',lat: position.coords.latitude, lng: position.coords.longitude};
        $scope.location.lat  = position.coords.latitude;
        $scope.location.long = position.coords.longitude;
        StoreTaskData()
      }, function(err) {
        // error
      })
  }



  $scope.watchLocation = function () {
    console.log("WATCH LOCATION");
    $scope.event = "Watch Location";
    $scope.location = {lat: null, long: null};
    var watchOptions = {
      timeout : 3000,
      enableHighAccuracy: false // may cause errors if true
    };
    $scope.taskData.watchLocation = {status: 'true', data:[]};
  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  watch.then(
    null,
    function(err) {
      // error
    },
    function(position) {
      $scope.event = "Getting Current Location";
      $scope.taskData.watchLocation.data.push({lat: position.coords.latitude, lng: position.coords.longitude})
      $scope.location.lat  = position.coords.latitude;
      $scope.location.long = position.coords.longitude;
  });
  }



  $scope.stopWatchLocation = function () {
    $cordovaGeolocation.clearWatch(watch)
    .then(function(result) {
      StoreTaskData();
      }, function (error) {
      // error
    });
  }


  $scope.currentAcceleration = function () {
    $scope.event = "Getting Current Acceleration";
    console.log("current acceleration");
    $scope.acceleration = {x:null,y:null,z:null,timeStamp:null};
    $cordovaDeviceMotion.getCurrentAcceleration().then(function(result) {
      $scope.taskData.currentAcceleration = {status: 'true',x: result.x, y: result.y, z: result.x, timeStamp : result.timestamp};
      $scope.acceleration.x = result.x;
      $scope.acceleration.y = result.y;
      $scope.acceleration.z = result.z;
      $scope.acceleration.timeStamp = result.timestamp;
      StoreTaskData();
    }, function(err) {
      // An error occurred. Show a message to the user
    });

  }



  $scope.watchAcceleration = function () {
    $scope.acceleration = {x:null,y:null,z:null,timeStamp:null};
    $scope.taskData.watchAcceleration = {status: 'true', data:[]};
    $scope.event = "Watch Acceleration";
    console.log("watch acceleration");
    var options = { frequency: 2000 };
    var watch = $cordovaDeviceMotion.watchAcceleration(options);
    watch.then(
      null,
      function(error) {
      // An error occurred
      },
      function(result) {
        $scope.event = "Watch Started";
        $scope.taskData.watchAcceleration.data.push({x: result.x, y: result.y, z: result.x, timeStamp : result.timestamp})
        $scope.acceleration.x = result.x;
        $scope.acceleration.y = result.y;
        $scope.acceleration.z = result.z;
    });
  }


  $scope.stopWatchAcceleration = function () {
    $cordovaDeviceMotion.clearWatch(watch)
      .then(function(result) {
        StoreTaskData();
        }, function (error) {
        // error
      });
  }


  $scope.captureAudio = function() {
    $scope.event = "Capture Audio";
    console.log("==================INSIDE SCOPE.CAPTUREAUDIO==================");
    var options = { limit: 1, duration: 10 };

    $cordovaCapture.captureAudio(options).then(function(audioData) {
      for (i = 0, len = audioData.length; i < len; i += 1) {
        path = audioData[i].fullPath;
        console.log(path);
        $scope.taskData.sound = {status: 'true', path: mediaFiles[i].fullPath, truePath: mediaFiles[i].fullPath};
        $scope.sound = {path: $sce.trustAsResourceUrl(mediaFiles[i].fullPath)}
        StoreTaskData()
        // do something interesting with the fil
      }
    }, function(err) {
      console.log("==================INSIDE ERROR CALLBACK===================");
      // An error occurred. Show a message to the user
    });
  }

  $scope.captureImage = function() {
    $scope.event = "Capture Image";
    var options = { limit: 1 };

    $cordovaCapture.captureImage(options).then(
      function(imageData) {
        for (i = 0, len = imageData.length; i < len; i += 1) {
          path = imageData[i].fullPath;
          console.log(path);
          $scope.taskData.image = {status: 'true', path: imageData[i].fullPath};
          StoreTaskData()
          // do something interesting with the fil
        }
      }, function(err) {
      // An error occurred. Show a message to the user
    });
  }


  $scope.captureImages = function() {
    $scope.event = "Capture Image";
    var options = { limit: 10 };

    $cordovaCapture.captureImage(options).then(
      function(imageData) {
        $scope.taskData.images = {status: 'true', paths: []};
        for (i = 0, len = imageData.length; i < len; i += 1) {
          path = imageData[i].fullPath;
          console.log(path);
          $scope.taskData.images.paths.push(imageData[i].fullPath);
        }
        StoreTaskData();
      }, function(err) {
        console.log(JSON.stringify(err));
      // An error occurred. Show a message to the user
    });
  }


  $scope.captureVideo = function() {
    $scope.event = "Capture Video";
    var options = { limit: 1};
    $scope.taskData.video = {status: 'false'}

    $cordovaCapture.captureVideo(options).then(
      function(mediaFiles) {
        var i, path, len;
        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
          path = mediaFiles[i].fullPath;
          console.log(path);
          $scope.taskData.video = {status: 'true', path: mediaFiles[i].fullPath, truePath: mediaFiles[i].fullPath};
          $scope.video = {path : $sce.trustAsResourceUrl(mediaFiles[i].fullPath)}
          StoreTaskData();
        }
      }, function(err) {
      // An error occurred. Show a message to the user
    });
  }

  $scope.magicBox = function () {
    $scope.magicBox.deviceStatus = "Searching for Device";
    $scope.taskData.magicBox = {status: 'true', data:[], hideControls: 'true'};
    var wificonfig = WifiWizard.formatWifiConfig('RaspberryPi', 'raspberry', 'WPA');
    WifiWizard.addNetwork(wificonfig, function () {
      console.log("NETWORK ADD SUCCESS");
      WifiWizard.connectNetwork('RaspberryPi', function () {
        $scope.magicBox.labels = ["Completed", "Remaining"];
        $scope.magicBox.progress = [0, 100];
        console.log("WIFI CONNECTED");
        var raspsocket = io.connect("http://172.24.1.1:3000"); //{reconnection: false, timeout : 20000}
        raspsocket.on('connect',function() {
          console.log("SOCKET CONNECTED");
          $scope.$apply(function () {
              $scope.magicBox.deviceStatus = "Device connected";
              raspsocket.emit('startapp', $scope.currentLocation.lat + '-' + $scope.currentLocation.lng + '-' + $scope.task.user_task.id);
          });
        });
        // console.log("________________TIMEOUT_____________________");
        // console.log(raspsocket.io.timeout());
        // console.log("_____________________________________");
        raspsocket.io.on('connect_timeout',function() { //Try using this event instead - error
          console.log("CONNECTION TIMEOUT");
          $scope.$apply(function () {
            console.log("WIFI NOT CONNECTED");
            $scope.magicBox.deviceStatus = "Device not found, turn on the device and tap the start button again";
            $scope.taskData.magicBox.hideControls = 'false'
          });
        });
        raspsocket.on('stdout', function (msg) {
          $scope.$apply(function () {
              $scope.magicBox.progress = [parseInt(msg), 100  - parseInt(msg)];
          });
          console.log("STDOUT");
          console.log(msg);
        })
        raspsocket.on('stderr', function (msg) {
          $scope.$apply(function () {
              $scope.magicBox.message = msg;
          });
          console.log("STDERR");
          console.log(msg);
        })
        raspsocket.on('complete', function (msg) {
          $scope.$apply(function () {
              $scope.magicBox.progress = [100, 0];
          });
          console.log("COMPLETE");
          console.log(msg);
          raspsocket.disconnect();
        })
      }, function () {
        console.log("WIFI NOT CONNECTED");
        $scope.magicBox.deviceStatus = "Device not found, turn on the device and tap the start button again";
        $scope.taskData.magicBox.hideControls = 'false'
      });
    }, function () {
      console.log("NETWORK ADD FAILURE");
      $scope.taskData.magicBox.hideControls = 'false'
    });
  }


  function refreshDistance() {
    $scope.currentLocation = {lat: null, lng: null};
    var posOptions = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        $scope.currentLocation.lat  = position.coords.latitude;
        $scope.currentLocation.lng = position.coords.longitude;
        MapsInit($scope.currentLocation, $scope.task.pos);
      }, function(err) {
        // error
      })
  }


  $scope.sensor = null;
  $scope.task = null;
  var task_id = $stateParams.task_id;
  var cookie = DataStoreService.getLogin().cookie;
  $http({method: 'GET', url: ybarURL + "/api/get_task", params: {"cookie":cookie, "id":task_id, "insecure":"cool"}, cache: false}).
  then(
    function (response) {
      console.log(response);
      $scope.sensor = response.data.task.sensors;
      $scope.task = response.data;
      if ($scope.task.user_task.task_status == 'pending') {
        for (var i = 0; i < ybardata.storedtasks.length; i++) {
          if ($scope.task.user_task.id == ybardata.storedtasks[i].user_task_id) {
            $scope.taskData = ybardata.storedtasks[i];
            console.log($scope.currentLocation.lat);
            console.log($scope.currentLocation.lng);
            console.log("STORED TASK ===================================");
            console.log(JSON.stringify(ybardata.storedtasks[i]));
            if ($scope.taskData.sensor == 'video') {
              $scope.video = {path : $sce.trustAsResourceUrl($scope.taskData.video.path)}
            }
            if ($scope.taskData.sensor == 'sound') {
              $scope.sound = {path : $sce.trustAsResourceUrl($scope.taskData.sound.path)}
            }
            $scope.storedTask = true;
            console.log($scope.taskData);
          }
        }
        if ($scope.storedTask == false) {
          $http({method: 'GET', url: "https://maps.googleapis.com/maps/api/place/details/json", params: {"placeid":$scope.task.task.location, "key":googleapikey}, cache: false}).
          then(
            function (response) {
              console.log("GOOGLE MAPS API RESPONSE");
              console.log(response);
              $scope.task.address = response.data.result.formatted_address;
              $scope.task.pos = response.data.result.geometry.location;
              $scope.currentLocation = {lat: null, lng: null};
              var posOptions = {timeout: 10000, enableHighAccuracy: true};
              $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                  $scope.currentLocation.lat  = position.coords.latitude;
                  $scope.currentLocation.lng = position.coords.longitude;
                  console.log("CALLING MAPSINIT");
                  MapsInit($scope.currentLocation, $scope.task.pos);
                }, function(err) {
                  console.log("GOOGLE MAPS API ERROR");
                  console.log(err);
                })
            },
            function () {

            }
          )
        }
      }else {
        $scope.task_data = JSON.parse($scope.task.user_task.task_data)
        if ($scope.task_data.sensor == 'video') {
          $scope.task_data.video.path = $sce.trustAsResourceUrl($scope.task_data.video.path)
        }
        if ($scope.task_data.sensor == 'sound') {
          $scope.task_data.sound.path = $sce.trustAsResourceUrl($scope.task_data.sound.path)
        }
        console.log($scope.task_data);
      }
      console.log($scope.task);
    },
    function () {

    }
  )

  $scope.uploadTask = function () {
    $ionicLoading.show({
        content: 'Loading...',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
      });
    $scope.socket = SocketService.getSocket();
        $scope.socket.on("connect", function() {
          console.log('Device Connected');
          $scope.connected = true;
          var board = { type:"mobile", macAddress: $scope.deviceID};
          $scope.socket.emit('add-mac', board);
          $scope.taskData.sensor = $scope.sensor;
          $scope.taskData.user_task_id = $scope.task.user_task.id;
          $scope.taskData.job_task_id = $scope.task.task.id;
          $scope.taskData.user = DataStoreService.getLogin().user;
          $scope.taskData.images.files = [];
          if ($scope.sensor === 'images') {
            console.log("TRYING TO READ MULTIPLE IMAGES");
            var count = $scope.taskData.images.paths.length;
            var pointer = 0;
            var readFile = function () {
              console.log("POINTER = " + pointer);
              window.resolveLocalFileSystemURL($scope.taskData.images.paths[pointer], gotFile, fail);
              function fail(e) {
                  console.log("FileSystem Error");
                  console.dir(e);
              }

              function gotFile(fileEntry) {
                  fileEntry.file(function(file) {
                      var reader = new FileReader();
                      reader.onloadend = function(e) {
                          var content = this.result;
                          var message = {
                            sensor : "file",
                            content : content,
                            filepath : $scope.taskData.images.paths[pointer],
                            userTaskId : $scope.task.user_task.id
                          }
                          $scope.socket.emit('localdata', message, function () {
                            console.log("FILE NO. " + pointer + "RECIEVED BY SERVER");
                            if (pointer < count-1) {
                              pointer++;
                              readFile();
                            }else {
                              send();
                            }
                          });
                      };
                      reader.readAsArrayBuffer(file);
                  });
              }
            }
            readFile();
          }else if ($scope.sensor === 'image') {

            console.log("TRYING TO READ IMAGE");

            window.resolveLocalFileSystemURL($scope.taskData.image.path, gotFile, fail);

            function fail(e) {
                console.log("FileSystem Error");
                console.dir(e);
            }

            function gotFile(fileEntry) {
                fileEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        var content = this.result;
                        $scope.taskData.image.file = content;
                        console.log("File read");
                        console.log(content);
                        send();
                    };
                    reader.readAsArrayBuffer(file);
                });
            }

            // var arr = $scope.taskData.image.path.split("/0");
            // console.log(arr[ arr.length -1 ]);
            // $cordovaFile.readAsArrayBuffer(cordova.file.externalRootDirectory, arr[ arr.length -1 ])
            // .then(function (result) {
            //   console.log("File Found");
            //   $scope.taskData.image.file = result;
            //   send();
            // }, function (error) {
            // });

          }else if ($scope.sensor === 'sound') {
            console.log("TRYING TO READ SOUND");

            window.resolveLocalFileSystemURL($scope.taskData.sound.truePath, gotFile, fail);

            function fail(e) {
                console.log("FileSystem Error");
                console.dir(e);
            }

            function gotFile(fileEntry) {
                fileEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        var content = this.result;
                        $scope.taskData.sound.file = content;
                        console.log("File read");
                        console.log(content);
                        send();
                    };
                    reader.readAsArrayBuffer(file);
                });
            }

            // var arr = $scope.taskData.sound.path.split("/0");
            // console.log(arr[ arr.length -1 ]);
            // $cordovaFile.readAsArrayBuffer(cordova.file.externalRootDirectory, arr[ arr.length -1 ])
            // .then(function (result) {
            //   $scope.taskData.sound.file = result;
            //   send();
            // }, function (error) {
            // });
          }else if ($scope.sensor === 'video') {
            console.log("TRYING TO READ VIDEO");

            window.resolveLocalFileSystemURL($scope.taskData.video.truePath, gotFile, fail);

            function fail(e) {
                console.log("FileSystem Error");
                console.dir(e);
            }

            function gotFile(fileEntry) {
                fileEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        var content = this.result;
                        $scope.taskData.video.file = content;
                        console.log("File read");
                        console.log(content);
                        send();
                    };
                    reader.readAsArrayBuffer(file);
                });
            }

            // var arr = $scope.taskData.video.truePath.split("/0");
            // console.log("VIDEO PATHS");
            // console.log($scope.taskData.video.truePath);
            // console.log(arr[ arr.length -1 ]);
            // $cordovaFile.readAsArrayBuffer(cordova.file.externalRootDirectory, arr[ arr.length -1 ])
            // .then(function (result) {
            //   $scope.taskData.video.file = result;
            //   send();
            // }, function (error) {
            // });
          }else {
            send();
          }

          function send() {
            console.log("Sending File");
            $scope.socket.emit('localdata', $scope.taskData, function () {
              $ionicLoading.hide();
              $scope.socket.disconnect();
              for (var i = 0; i < ybardata.storedtasks.length; i++) {
                if ($scope.task.user_task.id == ybardata.storedtasks[i].user_task_id) {
                  ybardata.storedtasks.splice(i, 1);
                  StoreTaskData();
                  $state.go($state.current, {}, {reload: true});
                }
              }
            });
          }
          function sendSingleFile() {
            console.log("Sending File");
            $scope.socket.emit('localdata', $scope.taskData, function () {
              $ionicLoading.hide();
              $scope.socket.disconnect();
              for (var i = 0; i < ybardata.storedtasks.length; i++) {
                if ($scope.task.user_task.id == ybardata.storedtasks[i].user_task_id) {
                  ybardata.storedtasks.splice(i, 1);
                  StoreTaskData();
                  $state.go($state.current, {}, {reload: true});
                }
              }
            });
          }
        });
  }


  $scope.redoTask = function () {
    $scope.taskData = {};
  }

  $scope.onTouch = function (button) {
    $scope[button] = true;
    setTimeout(function(){
      $scope.$apply(function () {
        $scope[button] = false;
      });
    }, 500);
  }

  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams){
        console.log("STATE CHANGE");
        $scope.showMap = false;
    }
  )


}])



.controller('resetPasswordCtrl', ['$scope', '$stateParams', '$ionicPopup', '$http', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicPopup, $http, $state) {
  $scope.user = {};
  $scope.reset = function () {
    $http({method: 'GET', url: ybarURL + "/api/user/retrieve_password/", params: {"user_login":$scope.user.username, "insecure":"cool"}, cache: false}).
    then(function (response) {
      console.log(response);
      if (response.data.status == 'o') {
        $scope.showAlert();
      }
      console.log(response);
    }, function () {

    })
  }
  $scope.showAlert = function() {
   var alertPopup = $ionicPopup.alert({
     title: 'Password Reset',
     template: 'Please check your email for reset password link',
     buttons: [
      {
        text: 'Login',
        type: 'button-positive',
        onTap: function () {
          $state.go('login');
        }
      }
    ]
   });
 };
}])


.controller('landingCtrl', ['$scope', '$stateParams', '$state', '$cordovaFile', '$cordovaDevice', '$http', 'APIService', 'DataStoreService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $state, $cordovaFile, $cordovaDevice, $http, APIService, DataStoreService) {
  $scope.view = 'loader';
  var cookie = null;
  $scope.AuthValidate = function () {
    window.loadMapsApi();
    $scope.view = 'loader';
    console.log("After loadmaps api");
    $http({method: 'GET', url: ybarURL + "/api/user/validate_auth_cookie", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
    then(
      function (response) {
        console.log(JSON.stringify(response));
        if (response.data.status == "ok" && response.data.valid == true) {
          DataStoreService.setLogin(ybardata.user)
          var cookie = DataStoreService.getLogin().cookie;
          $http({method: 'GET', url: ybarURL + "/api/list_all_jobs", params: {"cookie":cookie, "insecure":"cool"}, cache: false}).
          then(
            function (response) {
              DataStoreService.setJobList(response.data.jobs);
              $state.go('menu.findJobs');
              $scope.loader = false;
            },
            function () {
              $scope.view = 'interneterror';
            }
          )
        }else{
          $scope.view = 'landing';
        }
      },
      function () {
        //NO INTERNET RETRY
        $scope.view = 'interneterror';
      }
    )
  }
  var checkPreviousLogin = function () {
    console.log("SEARCHING YBARDATA FILE");
    $cordovaFile.checkFile(cordova.file.dataDirectory, "ybardata.json")
    .then(function (success) {
      $scope.view = 'loader';
      $cordovaFile.readAsText(cordova.file.dataDirectory, "ybardata.json")
        .then(function (result) {
          ybardata = JSON.parse(result);
          cookie = ybardata.user.cookie
          $scope.AuthValidate();
        }, function (error) {
          console.log("YBARDATA.JSON NOT READ");
          console.log(error);
          $scope.view = 'landing';
        });
    }, function (error) {
      console.log(error);
      console.log("YBARDATA.JSON NOT FOUND");
      $scope.view = 'landing';
    });
  }
  document.addEventListener("deviceready", checkPreviousLogin, false);
  $scope.holdtext = "Drop Here";
  $scope.login = {title: 'Login', state:'login'};
  $scope.signup = {title: 'Signup', state: 'signup'};
  $scope.resetPassword = {title: 'Reset Password', state: 'resetPassword'};
  $scope.drop = {title: null, state: null};
  $scope.onDrop = function (state) {
    if (state) {
      $state.go(state);
    }
  }
  $scope.onHold = function (title) {
    $scope.holdtext = title;
  }
  $scope.onRelease = function () {
    $scope.holdtext = "Drop Here";
  }
  $scope.options = {
    drag : {
      animate : true
    },
    drop : {
    }
  }
}])



.controller('menuCtrl', ['$scope', '$stateParams', '$ionicPopup', '$http', '$state', '$cordovaFile', 'DataStoreService',// The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $ionicPopup, $http, $state, $cordovaFile, DataStoreService) {
  $scope.logout = function () {
    $cordovaFile.removeFile(cordova.file.dataDirectory, "ybardata.json")
      .then(function (success) {
        DataStoreService.logout();
        ybardata = {
          "user" : null,
          "storedtasks" : []
        }
        $state.go('landing');
      }, function (error) {
      });
  }
}])
