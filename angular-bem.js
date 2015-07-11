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
            .directive('iBem', iBemDirective);

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

        function iBemDirective() {
            return {
                restrict : 'C',
                require : '?ngModel',
                link : function(scope, element, attrs, ngModel) {
                    if(!ngModel) return;

                    var bem = scope.$eval(attrs.bem);
                    angular.forEach(bem, function(v, k){
                        bem[k] = $(element).bem(k);

                        bem[k].on('change', function(e, data) {
                            if(data && data.source === 'ng-model') {
                                scope.$evalAsync(setModelValue.bind(bem[k]));
                            } else {
                                scope.$evalAsync(setViewValue.bind(bem[k]));
                            }
                        });

                        setModelValue.bind(bem[k])();
                    });

                    ngModel.$render = function() {
                        var value = angular.isUndefined(ngModel.$viewValue)? '' : ngModel.$viewValue;
                        angular.forEach(bem, function(v, k){
                            if(bem[k].setVal) bem[k].setVal(value, { source : 'ng-model' });
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
