modules.define('bemdom', ['i-bem__dom'], function(provide, BEMDOM) {
    provide(BEMDOM);
});

modules.define('angular-bem',
    ['BEMHTML', 'bemdom', 'jquery', 'i-bem__dom_init'],
    function(provide, BEMHTML, BEMDOM, $) {

        angular.module('angular-bem', [])
            .value('bemhtml', BEMHTML)
            .value('bemdom', BEMDOM)
            .factory('ngbem', ngBemFactory)
            .directive('ngBem', ngBemDirective)
            .directive('bem', iBemDirective);

        function ngBemFactory($compile) {
            var service = { render : render };

            return service;

            function render(bemjson, element, scope) {
                element.replaceWith(
                    $compile(BEMHTML.apply(bemjson))(scope)
                );
            }
        }

        function ngBemDirective(ngbem) {
            return {
                restrict : 'E',
                link : function(scope, element, attrs) {
                    var bemjson = scope.$eval(attrs.bemJson || element.text());

                    ngbem.render(bemjson, element, scope);
                }
            };
        }

        function bemController($scope, $attrs, $element) {
            this.bem = $scope.$eval($attrs.bem);

            angular.forEach(this.bem, function(v, k){
                this.bem[k] = $($element).bem(k);
            }, this);
        }

        function iBemDirective() {
            return {
                restrict : 'A',
                require : ['bem', '?ngModel'],
                controller : bemController,
                link : function(scope, element, attrs, ctrls) {
                    var iBem = ctrls[0],
                        ngModel = ctrls[1];

                    if(!ngModel) return;

                    angular.forEach(iBem.bem, function(v, k){
                        iBem.bem[k].on('change', function(e, data) {
                            if(data && data.source === 'ng-model') {
                                scope.$evalAsync(setModelValue.bind(iBem.bem[k]));
                            } else {
                                scope.$evalAsync(setViewValue.bind(iBem.bem[k]));
                            }
                        });

                        setModelValue.bind(iBem.bem[k])();
                    });

                    ngModel.$render = function() {
                        var value = angular.isUndefined(ngModel.$viewValue)? '' : ngModel.$viewValue;
                        angular.forEach(iBem.bem, function(v, k){
                            if(iBem.bem[k].setVal) iBem.bem[k].setVal(value, { source : 'ng-model' });
                        });
                    };

                    function setViewValue() {
                        ngModel.$setViewValue(this.getVal());
                    }

                    function setModelValue() {
                        // prevents calling of ng-change listeners
                        ngModel.$modelValue = this.getVal();
                    }
                }
            };
        }

        provide(angular.module('angular-bem'));
    }
);
