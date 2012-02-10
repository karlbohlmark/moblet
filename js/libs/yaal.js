(function() {
  var define, getAnonName, getModule, moduleStore, normalizedDefine, onResolvedDependency, require, startFetch;
  moduleStore = {
    _modules: [],
    _waitHandles: {},
    currentModule: []
  };
  getModule = function(m) {
    switch (m) {
      case 'require':
        return getRequire(m);
      case 'exports':
        return {};
      case 'module':
        return getModule(m);
      default:
        return moduleStore._modules[d].exports;
    }
  };
  startFetch = function(name) {
    var scr;
    moduleStore.currentModule.unshift(name);
    scr = document.createElement('script');
    scr.src = name;
    scr.onload = function() {
      return moduleStore.shift();
    };
    return document.head.appendChild(src);
  };
  moduleStore.register = function(descr) {
    var exists;
    exists = this._modules[descr.name];
    if (exists != null) {
      return;
    }
    this._modules[descr.name];
    return startFetch(descr.name);
  };
  moduleStore.onModuleResolved = function(name, callback) {
    var _base, _ref;
    return ((_ref = (_base = this._waitHandles)[name]) != null ? _ref : _base[name] = []).push(callback);
  };
  moduleStore.resolve = function(name) {
    var dependencyArr, descr, exports, waitHandle, _i, _len, _ref, _results;
    descr = moduleStore._modules[name];
    console.log(name);
    console.log(descr);
    dependencyArr = descr.deps.map(getModule);
    exports = descr.isObjectLiteral != null ? descr.factory : descr.factory.apply(null, dependencyArr);
    descr.exports = exports;
    _ref = moduleStore._waitHandles[name] || [];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      waitHandle = _ref[_i];
      _results.push(waitHandle(name));
    }
    return _results;
  };
  onResolvedDependency = function(descriptor, dep) {
    descriptor.unresolvedDeps = descriptor.unresolvedDeps.filter(d(function() {
      return d !== dep;
    }));
    if (descriptor.unresolvedDeps.length === 0) {
      return moduleStore.resolve(descriptor.name);
    }
  };
  normalizedDefine = function(name, deps, factory) {
    var dep, descriptor, resolvedDep, _i, _len, _results;
    descriptor = {
      name: name,
      deps: deps,
      unresolvedDeps: deps,
      factory: factory,
      isObjectLiteral: typeof (factory = 'object'),
      resolved: false
    };
    moduleStore.register(descriptor);
    resolvedDep = onResolvedDependency.bind({}, descriptor);
    _results = [];
    for (_i = 0, _len = deps.length; _i < _len; _i++) {
      dep = deps[_i];
      _results.push(moduleStore.onModuleResolved(dep, resolvedDep));
    }
    return _results;
  };
  define = function() {
    var deps, i, name;
    i = 0;
    if (typeof (arguments[i] = 'string')) {
      name = arguments[i];
      i++;
    } else {
      name = getAnonName();
    }
    if (Array.isArray(arguments[i])) {
      deps = arguments[i];
      i++;
    } else {
      deps = [];
    }
    return normalizedDefine(name, deps, arguments[i]);
  };
  getAnonName = function() {
    return define.currentModule[0];
  };
  window.define = define;
  require = function(deps, callback) {};
}).call(this);
