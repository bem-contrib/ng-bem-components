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
            .directive('bem', iBemDirective)
            .directive('bemMod', bemModDirective)
            .directive('bemEvent', bemEventDirective);

        function ngBemFactory(bemhtml) {
            var service = { render : render };

            return service;

            function render(bemjson) {
                return bemhtml.apply(bemjson);
            }
        }

        function ngBemDirective(ngbem, bemdom, $compile) {
            return {
                restrict : 'E',
                link : function(scope, element, attrs) {
                    var bemjsonExpression = attrs.bemjson || element.text(),
                        ctx = element;

                    scope.$watch('[' + attrs.observe + ']', function(){
                        // copy prevents unnecessary call of watch function
                        var bemjson = angular.copy(scope.$eval(bemjsonExpression));

                        ctx = bemdom.replace(ctx, ngbem.render(bemjson));

                        $compile(ctx)(scope);

                    }, true);

                    scope.$on('$destroy', function(){
                        bemdom.destruct(ctx);
                    });

                }
            };
        }

        function bemController($scope, $attrs, $element) {
            this.bem = $scope.$eval($attrs.bem);

            angular.forEach(this.bem, function(v, k) {
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

                    angular.forEach(iBem.bem, function(v, k) {
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
                        angular.forEach(iBem.bem, function(v, k) {
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

        function bemModDirective() {
            return {
                restrict : 'A',
                require : 'bem',
                link : function(scope, element, attrs, iBem) {
                    var oldVal;

                    scope.$watch(attrs.bemMod, bemModWatchAction, true);

                    function setMods(newVal) {
                        angular.forEach(newVal, function(v, block) {
                            angular.forEach(v, function(modVal, modName) {
                                this.setMod(modName, modVal);
                            }, iBem.bem[block]);
                        });
                    }

                    function bemModWatchAction(newVal) {
                        if(!angular.equals(newVal, oldVal)) {
                            setMods(newVal);
                        }

                        oldVal = shallowCopy(newVal);
                    }
                }
            };
        }

        function bemEventDirective($parse) {
            return {
                restrict : 'A',
                require : 'bem',
                link : function(scope, element, attrs, iBem) {
                    var events = scope.$eval(attrs.bemEvent);

                    angular.forEach(events, function(eventsArray, block) {
                        angular.forEach(eventsArray, function(eventDefenition) {
                            var event,
                                fn;

                            if(eventDefenition.length === 2) {
                                event = eventDefenition[0];
                                fn = $parse(eventDefenition[1], null, true);
                            } else if(eventDefenition.length === 3) {
                                event = {
                                    modName : eventDefenition[0],
                                    modVal : eventDefenition[1]
                                };
                                fn = $parse(eventDefenition[2], null, true);
                            }

                            this.on(event, function() {
                                scope.$apply(function() {
                                    fn(scope);
                                });
                            });
                        }, iBem.bem[block]);
                    });
                }
            };
        }

        function shallowCopy(src, dst) {
            if(angular.isArray(src)) {
                dst = dst || [];

                for(var i = 0, ii = src.length; i < ii; i++) {
                    dst[i] = src[i];
                }
            } else if(angular.isObject(src)) {
                dst = dst || {};

                for(var key in src) {
                    if(!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                        dst[key] = src[key];
                    }
                }
            }

            return dst || src;
        }

        provide(angular.module('angular-bem'));
    }
);
