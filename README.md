# ng-bem-components

An [AngularJS](angularjs.org) `angular-bem` module for using components based on [`i-bem.js`](https://en.bem.info/libs/bem-core/current/desktop/i-bem/) framework.
See [bem-core](https://en.bem.info/libs/bem-core/) and [bem-components](https://en.bem.info/libs/bem-components/) for further details.

Module will allow you to render `BEMJSON`, help you to work with BEM mods and events, and provide some integrations of `i-bem` blocks with Angular directives.

## Install

```sh
bower i ng-bem-components --save
```

`angular-bem` depends on [`i-bem__dom`](https://en.bem.info/libs/bem-core/v2.7.0/desktop/i-bem/jsdoc/#jsdoc-i-bem__dom-1), `jquery`, [`BEMHTML`](https://en.bem.info/technology/bemhtml/current/rationale/) and [`BEMTREE`](https://en.bem.info/technology/bemtree/) (optional) from [`ymodules`](https://en.bem.info/tools/bem/modules/) modular system.
Include `angular-bem.js` in your js bundle or html file in any place where `ymodules` is already defined.

## Bootstrap Angular app

You will not be able to use `ngApp` directive since dependencies are provided asynchronously.
Require `angular-bem` module from `ymodules` to [bootstrap](https://docs.angularjs.org/api/ng/function/angular.bootstrap) your angular app instead.

```js
angular.module('my-app', ['angular-bem', ...]);

modules.require('angular-bem', function(){
    angular.bootstrap(document, ['my-app']);
});
```

## Services

Module provides `i-bem__dom`, `BEMHTML` and `BEMTREE` from `ymodules` as angular injectable services `bemdom`, `bemhtml` and `bemtree` respectively.
`bemtree` service will be `undefined` (but still exists) if `BEMTREE` is not defined in ymodules.

### ngbem

`ngbem` service for processing `BEMJSON` with `BEMHTML` and `BEMTREE` templates.

#### Dependencies

`bemhtml` <br>
`bemtree` <br>
`$q` <br>
`$log`

#### Usage

`ngbem(bemjson, useBemtree);`

##### Arguments

Param      | Type      | Details
-----------|-----------|--------
bemjson    | `Object`  | Object in `BEMJSON` format to process.
useBemtree | `Boolean` | If set to `true` process `BEMJSON` with `BEMTREE` first of all.

##### Returns

`Promise` - Promise that will be resolved with HTML string processed from `bemjson`.

## Directives

### ngBem

Directive renders provided `BEMJSON` using `BEMHTML` and optionally `BEMTREE` templates.
`BEMJSON` has access to scope since is treated as [Angular Expression](https://docs.angularjs.org/guide/expression).
Rendered html initialized with [`bemdom`'s `init()`](https://en.bem.info/libs/bem-core/v2.7.0/desktop/i-bem/jsdoc/#jsdoc-init-1) method and compiled with Angular [$compile](https://docs.angularjs.org/api/ng/service/$compile) service.
List of scope variables could be provided to observe changes, which will lead to rerendering provided `BEMJSON`.

#### Dependencies

`ngbem` <br>
`bemdom` <br>
`$compile`

#### Usage

as element:

```html
<ng-bem
    [bemjson="expression"]
    [observe="string"]
    [bemtree]>
    [expression]
</ng-bem>

```

as attribute:
```html
<ANY
    ng-bem
    [bemjson="expression"]
    [observe="string"]
    [bemtree]>
    [expression]
</ANY>

```

##### Arguments

Param      | Type          | Details
-----------|---------------|--------
bemjson    | `expression`  | `BEMJSON` as [Angular Expression](https://docs.angularjs.org/guide/expression). Could be a refference to Object in scope.
observe    | `string`      | Comma separated list of scope variable to observe. Changes on it would lead to rerendering. 
bemtree    | `none`        | Flag to indicate whether `BEMTREE` templates should be used for `BEMJSON` processing.

#### Example

### bem

Directives attaches to `i-bem.js` blocks using `data-bem` attribute and provides next set of features:
 
 * Provide integration with some native Angular directives: `ngModel`, `ngChange` and events exposing directives like `ngBlur`
 * Allow to bind `i-bem.js` block mod to settable angular expression through `bem-mod-*` attributes
 * Call angular expression on `i-bem.js` events defined in `bem-event-*` and `bem-mod-event-*` attributes

#### Dependencies

`$parse`,
`bemController`,
`ngModelController`

#### Usage

You don't need to apply directive in your html templates.
It just automatically applies to every `i-bem.js` block when angular applies $compile on some DOM nodes or HTML.
Most likely you will use attributes provided by directive in `BEMJSON`.

Note: currently we support only short syntax for attributes definitions.
It means, that they applied to every block found on DOM-node.
Support for explicit definition which block should be used is planned on near releases.

##### Binding to mods

You could bind mods of `i-bem` blocks to scope variable with `bem-mod-mod-name="vm.modName"` syntax.
Changing scope variable `vm.modName` will change value of mod `mod-name` and vice-versa.

Note, that mod name is case sensitive, but you wouldn't be able to bind several mods if it differs only in case.
Anyway, using such mods (eg, `disabled` and `Disabled`) at the same time indicates problems in app architecture.

##### BEM events

You could bind expression to call on `i-bem.js` events with `bem-event-event-name="vm.eventNameOccured()"` syntax.
Bem events emmited on mod changes are also supported with `bem-modevent-mod-name="vm.modNameChanged()"` syntax.

`$bemEvent` object is exposed to called expression:

Attribute  | Details
-----------|--------
event      | Object representing bem event.
target     | Convenient alias to `$bemEvent.event.target`
data       | Additional data passed to event.

The same note about mod's and event's names case sensivity is also appliable here.

##### Supported Angular directives

* ngModel
* ngChange
* set of [ngEventName](https://github.com/angular/angular.js/blob/master/src/ng/directive/ngEventDirs.js#L49) directives

`i-bem.js` block must implement `getVal()` and `setVal(value)` methods to work with `ngModel`, and must emit bem `change` event to run expression in `ngChange` directive.

Note, that setting `updateOn` key of object defined in `ngModelOptions` most likely will not work as expected.

#### Example

## Conroller

### bemController

Provides access to `i-bem.js` block instances for `bemDirective` by exposing `bem` property with object.
Each key in object represents an `i-bem.js` block found on current DOM-node based on value in `data-bem` attribute.
Block will be initialized and cached on first access to key in `bem` object.
Most likely it will happen in bemDirective if any of supported attributes will be found.
`i-bem.js` allows several blocks exist on the same DOM-node. `bemController` will expose every of them.

