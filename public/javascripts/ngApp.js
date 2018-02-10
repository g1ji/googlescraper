angular.module('numThrApp', [])
        .directive('enterEvent', function () {
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if(event.which === 13) {
                        scope.$apply(function (){
                            scope.$eval(attrs.enterEvent);
                        });
                        event.preventDefault();
                    }
                });
            };
        })
        .controller('numThrCtrl', function ($scope,$http) {
            $scope.loading = false;
             $scope.googleResult =[];
             $scope.localResult = [];
           $scope.search = function(){
            if($scope.query && $scope.query.trim().length > 0){
            $scope.loading = true;
            $scope.googleResult = [];
             $scope.localResult = [];
            $http({
                url: '/search', 
                method: "GET",
                params: {q: $scope.query}
             }).then(
                   function(response){
                    $scope.googleResult = response.data.google_img;
                    $scope.localResult = response.data.local_links;
                    console.log(response)
                     // success callback
                     $scope.loading = false;
                   }, 
                   function(response){
                     // failure call back
                     $scope.loading = false;
                   }
                );
}
           }
        });