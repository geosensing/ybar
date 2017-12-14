const ybarURL = "http://ec2-35-165-96-143.us-west-2.compute.amazonaws.com/";
const googleapikey = "AIzaSyDu-uCPu_wttkTLGdrgi0_oGo9kiLj8deQ";

angular.module('app.services', [])


.service('SocketService', ["$http", "$rootScope", function($http, $rootScope){
var channel = null;
var socket = null;
var connected = false;
return{
  getChannel: function () {
    return channel;
  },
  getSocket : function() {
    socket = io.connect("http://funstore.io:2052");
    return socket;
  }
}
}])


.service('DataStoreService', [function(){
  var DataStore = {}
  var Services = {}
  Services.setLogin = function (loginData) {
    DataStore.loginData = loginData;
    console.log("Inside setLogin");
  }
  Services.getLogin = function () {
    console.log("Inside getLogin");
    return DataStore.loginData;
  }
  Services.logout = function () {
    DataStore.loginData = null;
  }
  Services.setJobList = function (jobList) {
    DataStore.jobList = jobList;
  }
  Services.getJobList = function (jobList) {
    return DataStore.jobList;
  }
  Services.setJobTasks = function (id, tasks) {
    for (var i = 0; i < DataStore.jobList.length; i++) {
      if (DataStore.jobList[i].id == id) {
        DataStore.jobList[i].tasks = tasks;
      }
    }
  }
  Services.getJob = function (id) {
    for (var i = 0; i < DataStore.jobList.length; i++) {
      if (DataStore.jobList[i].id == id) {
        return DataStore.jobList[i];
      }
    }
    return false;
  }
  return Services;
}])

.service('APIService', ['$http', function($http){
  return {
    //API Services
    nonce : function (controller, method) {
      var promise = $http.get(ybarURL + '/api/get_nonce/?'+'controller='+controller+'&method='+method);
      return promise
    },
    login : function (username, password, nonce, deviceID) {
      var promise = $http.get(ybarURL + '/api/user/generate_auth_cookie/?username='+username+'&password='+password+'&nonce='+nonce+'&insecure=cool&uuid='+deviceID);
      return promise;
    },
    register : function () {

    }
  }
}]);
