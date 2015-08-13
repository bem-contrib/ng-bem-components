var deps = ['jquery', 'i-bem__dom', 'BEMHTML'];

modules.isDefined('BEMTREE') &&
    deps.push('BEMTREE');

modules.define('angular-bem', deps,
    function(provide, $, BEMDOM, BEMHTML, BEMTREE) {

        angular.module('angular-bem', [])
            .value('bemdom', BEMDOM)
            .value('bemhtml', BEMHTML)
            .value('bemtree', BEMTREE)
            .factory('ngbem', ngBemFactory)
            .directive('ngBem', ngBemDirective)
            .directive('bem', iBemDirective)
            .directive('bemMod', bemModDirective)
            .directive('bemEvent', bemEventDirective);

        function ngBemFactory(bemhtml, bemtree, $q, $log) {
            var service = {
                render : render,
                processBemtree : processBemtree,
                processBemhtml : processBemhtml
            };

            return service;

            function processBemtree(bemjson) {
                return bemtree.apply(bemjson);
            }

            function processBemhtml(bemjson) {
                return bemhtml.apply(bemjson);
            }

            function render(bemjson, useBemtree) {
                var deferred = $q.defer(),
                    promise;

                if(useBemtree) {
                    angular.isUndefined(bemtree)?
                        $log.error('BEMTREE is not defined') && deferred.reject() :
                        processBemtree(bemjson).then(function(result){
                            deferred.resolve(result);
                        });
                } else {
                    deferred.resolve(bemjson);
                }

                promise = deferred.promise
                    .then(function(result){
                        return processBemhtml(result);
                    });

                return promise;
            }
        }

        function ngBemDirective(ngbem, bemdom, $compile) {
            return {
                restrict : 'E',
                link : function(scope, element, attrs) {
                    var bemjsonExpression = attrs.bemjson || element.text(),
                        useBemtree = !angular.isUndefined(attrs.bemtree);

                    scope.$watch('[' + attrs.observe + ']', function(){
                        // copy prevents unnecessary call of watch function
                        var bemjson = angular.copy(scope.$eval(bemjsonExpression));

                        ngbem.render(bemjson, useBemtree).then(function(html){
                            bemdom.update(element, html);
                            $compile(element.children())(scope);
                        });

                    }, true);

                    scope.$on('$destroy', function(){
                        bemdom.destruct(element.children());
                    });

                }
            };
        }

        function bemController($scope, $attrs, $element) {
            this.bem = $scope.$eval($attrs.bem);

            angular.forEach(this.bem, function(v, blockName) {
                var block;

                Object.defineProperty(this.bem, blockName, { get : function(){
                    return (block = block || $($element).bem(blockName));
                } });
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

                    angular.forEach(iBem.bem, function(v, blockName) {
                        iBem.bem[blockName].on('change', function(e, data) {
                            if(data && data.source === 'ng-model') {
                                scope.$evalAsync(setModelValue.bind(iBem.bem[blockName]));
                            } else {
                                scope.$evalAsync(setViewValue.bind(iBem.bem[blockName]));
                            }
                        });

                        setModelValue.bind(iBem.bem[blockName])();
                    });

                    ngModel.$render = function() {
                        var value = angular.isUndefined(ngModel.$viewValue)? '' : ngModel.$viewValue;
                        angular.forEach(iBem.bem, function(v, blockName) {
                            if(iBem.bem[blockName].setVal) iBem.bem[blockName].setVal(value, { source : 'ng-model' });
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
                        angular.forEach(newVal, function(v, blockName) {
                            angular.forEach(v, function(modVal, modName) {
                                this.setMod(modName, modVal);
                            }, iBem.bem[blockName]);
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

                    angular.forEach(events, function(eventsArray, blockName) {
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
                        }, iBem.bem[blockName]);
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
