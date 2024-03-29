;(function(exports) {
  // shim out Object.keys
  // ES5 15.2.3.14
  // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
  if (!Object.keys) {

    var hasDontEnumBug = true,
    dontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ],
    dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
      hasDontEnumBug = false;
    }
    Object.keys = function keys(object) {

      if (typeof object !== "object"   &&
          typeof object !== "function" ||
          object === null)
      {
        throw new TypeError("Object.keys called on a non-object");
      }

      var keys = [];
      for (var name in object) {
        if (object.hasOwnProperty(name)) {
          keys.push(name);
        }
      }

      if (hasDontEnumBug) {
        for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
          var dontEnum = dontEnums[i];
          if (object.hasOwnProperty(dontEnum)) {
            keys.push(dontEnum);
          }
        }
      }
      return keys;
    };
  }


  /*  Let us play nice with IE
   *  https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
   */
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
      "use strict";
      if (this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 0) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    }
  }


  // Start: DEBUGGING
  // ----------------

  /*  Since weld runs browser/server, ensure there is a console implementation.
   */

  var logger = (typeof console === 'undefined') ? { log : function(){} } : console;
  var nodejs = false;

  if (typeof process !== 'undefined' && process.title) {
    nodejs = true;
  }

  var color = {
    gray: '\033[37m',
    darkgray: '\033[40;30m',
    red: '\033[31m',
    green: '\033[32m',
    yellow: '\033[33m',
    lightblue: '\033[1;34m',
    cyan: '\033[36m',
    white: '\033[1;37m'
  };

  var inputRegex = /input|select|option|button/i;
  var imageRegex = /img/i;
  var textareaRegex = /textarea/i;
  var depth = 0;  // The current depth of the traversal, used for debugging.
  var successIndicator = nodejs ? (color.green + ' ✓' + color.gray) : ' Success';
  var failureIndicator = nodejs ? (color.red + ' ✗' + color.gray) : ' Fail';

  var debuggable = function debuggable(name, operation) {

    var label = name.toUpperCase();

    // All of the ops have the same signature, so this is sane.
    return function(parent, element, key, value) {
      logger.log(
        pad(),
        ((nodejs ? (color.gray + '┌ ') : '+ ') + label + ' -'),
        'parent:', colorize(parent) + ',',
        'element:', colorize(element) + ',',
        'key:', colorize(key) + ',',
        'value:', colorize(value)
      );

      depth+=1;

      if (operation) {
        var res = operation(parent, element, key, value);
        depth-=1;
        logger.log(pad(), (nodejs ? '└ ' : '+ ') + element + '' + (res !== false ? successIndicator : failureIndicator));
        return res;
      }

      depth-=1;
      d('- OPERATION NOT FOUND: ', label);
    };
  };

  /*  Generates padding used for indenting debugger statements.
   */

  var pad = function pad() {
    var l = depth, ret = '';
    while(l--) {
      ret += nodejs ? ' │   ' : ' |   ';
    }
    return ret;
  };

  /*  Debugger statement, terse, accepts any number of arguments
   *  that are passed to a logger.log statement.
   */

  var d = function d() {
    var args = Array.prototype.slice.call(arguments);

    // This is done because on the browser you cannot call console.log.apply
    logger.log(pad(), args.join(' '));
  };

  var colorize = function colorize(val) {
    var sval = val+'', u='undefined';
    if(nodejs) {
      if(sval === 'false' || sval === 'null' || sval === '' || sval === u || typeof val === u || val === false) {
        if(sval === '') { sval = '(empty string)' };
        return color.red + sval + color.gray;
      }
      else {
        return color.yellow + sval + color.gray;
      }
    }
    return sval;
  };

  // End: DEBUGGING
  // --------------


  /*  Weld!
   *  @param {HTMLElement} DOMTarget
   *    The target html node that will be used as the subject of data binding.
   *  @param {Object|Array} data
   *    The data that will be used.
   *  @param {Object} pconfig
   *    The configuration object.
   */
  exports.weld = function weld(DOMTarget, data, pconfig) {

    var parent = DOMTarget.parentNode;
    var currentOpKey, p, fn, debug;

    /*
     *  Configuration Object.
     *  @member {Object}
     *    Contains an explicit mapping of data-keys to element name/id/classes
     *  @member {Boolean}
     *    Determines if debugging will be enabled.
     *  @method {Boolean|Function}
     *    Determines the method of insertion, can be a functon or false.
     */

    var config = {
      alias : {},
      debug : false,
      insert: false // Default to append
    };

    // Merge the user configuration over the existing config
    if(pconfig) {
      for(p in pconfig) {
        if (pconfig.hasOwnProperty(p)) {
          config[p] = pconfig[p];
        }
      }
    }

    debug = config.debug;

    /*  An interface to the interal operations, implements common
     *  debugging output based on a standard set of parameters.
     *
     *  @param {Function} operation
     *    The function to call in "debug mode"
     */

    var ops = {
      siblings : function siblings(parent, element, key, value) {
        var remove = [],
        sibling,
        classes,
        cc,
        match,
        siblings = parent.children;
        cs = siblings.length; // Current Sibling
        element.weld = {
          parent  : parent,
          classes : element.className.split(' ')
        };

        // Find all siblings that match the exact classes that exist in the originally
        // matched element node
        while (cs--) {
          sibling = siblings[cs];

          if (sibling === element) {
            // If this is not the last item in the list, store where new items should be inserted
            if (cs < siblings.length) {
              element.weld.insertBefore = siblings[cs+1];
            }

            // remove the element here because siblings is a live list.
            // which means, if you remove it before hand, the length will mismatch and cause problems
            if (debug) {
              d('- REMOVE - element:', colorize(element), 'class:', colorize(element.className), 'id:', colorize(element.id));
            }

            parent.removeChild(element);

          // Check for the same class
          } else {
            classes      = sibling.className.split(' ');
            cc = classes.length;
            match        = true;
            while (cc--) {
              // TODO: optimize
              if (element.weld.classes.indexOf(classes[cc]) < 0) {
                match = false;
                break;
              }
            }

            // This element matched, you win a prize! DIE.
            if (match) {
              if (debug) {
                d('- REMOVE - element:', colorize(sibling), 'class:', colorize(sibling.className), 'id:', colorize(sibling.id));
              }
              parent.removeChild(sibling);
            }
          }
        }
      },
      traverse : function traverse(parent, element, key, value) {

        var type, target, i, keys, l, obj;
        var template = element;
        var templateParent = element.parentNode;

        // LEAF

        if(~({}).toString.call(value).indexOf('Date')) {
          value = value.toString();
        }

        if (value.nodeType || typeof value !== 'object') {
          ops.set(parent, element, key, value);

        // ARRAY / NodeList
        } else if (value.length && value[0]) {
          if (templateParent) {
            ops.siblings(templateParent, template, key, value);
          } else if (template.weld && template.weld.parent) {
            templateParent = template.weld.parent;
          }

          l = value.length;
          for (i=0; i<l; i++) {
            if (debug) {
              d('- CLONE - element:', colorize(element), 'class:', colorize(element.className), 'id:', colorize(element.id));
            }
            target = element.cloneNode(true);
            target.weld = {};

            // Clone weld params
            if (element.weld) {
              var keys = Object.keys(element.weld), currentKey = keys.length, weldParam;
              while(currentKey--) {
                weldParam = keys[currentKey];
                target.weld[weldParam] = element.weld[weldParam];
              }
            }
            ops.traverse(templateParent, target, i, value[i]);
            ops.insert(templateParent, target, i, value[i]);
          }

        // OBJECT
        } else {
          var keys = Object.keys(value), current = keys.length, obj;
          while (current--) {
            var lkey    = keys[current];
            obj    = value[lkey];
            target = ops.match(template, element, lkey, obj);

            if (target) {
              ops.traverse(template, target, lkey, obj);

            // Handle the case where a parent data key doesn't
            // match a dom node, but the child data object may.
            // don't continue traversing if the child data object
            // is not an array/object
            } else if (target !== false        &&
                       typeof obj === 'object' &&
                       Object.keys(obj).length > 0) // TODO: optimize
            {
              ops.traverse(templateParent, template, lkey, obj);
            }
          }
        }
      },
      elementType : function elementType(parent, element, key, value) {
        if (element) {
          var nodeName = element.nodeName;

          if (typeof nodeName === "string") {
            if (inputRegex.test(nodeName)) {
              return 'input';
            }

            if (imageRegex.test(nodeName)) {
              return 'image';
            }

            if (textareaRegex.test(nodeName)) {
              return 'textarea';
            }
          }
        }
      },
      map : false, // this is a user-defined operation
      insert : function(parent, element) {
        // Insert the template back into document
        if (element.weld && element.weld.insertBefore) {
          parent.insertBefore(element, element.weld.insertBefore);
        } else {
          parent.appendChild(element);
        }
      },
      set : function set(parent, element, key, value) {

        if(ops.map && ops.map(parent, element, key, value) === false) {
          return false;
        }

        if(debug) {
          d('- SET: value is', value.tagName);
        }

        var type = ops.elementType(parent, element, key, value), res = false;

        if (value && value.nodeType) { // imports.

          if (element.ownerDocument !== value.ownerDocument) {
            value = element.ownerDocument.importNode(value, true);
          } else if (value.parentNode) {
            value.parentNode.removeChild(value);
          }

          while (element.firstChild) { // clean first.
            element.removeChild(element.firstChild);
          }

          element.appendChild(value);
          res = true;
        }
        else if (type === 'input') { // special cases.
          element.setAttribute('value', value);
          res = true;
        }
        else if (type === 'image') {
          element.setAttribute('src', value);
          res = true;
        }
        else if (type === 'textarea') {
          element.textContent = value;
          if (element.value !== value) {
            // Here's looking at you Opera.
            element.value = value;
          }
          res = true;
        }
        else { // simple text assignment.
          element.textContent = value;
          res = true;
        }
        return res;
      },
      match : function match(parent, element, key, value) {
        if(typeof config.alias[key] !== 'undefined') {
          if(typeof config.alias[key] === 'function') {
            key = config.alias[key](parent, element, key, value) || key;
          }
          else if(config.alias[key] === false) {
            return false;
          }
          else {
            key = config.alias[key];
          }
        }

        // Alias can be a node, for explicit binding.
        // Alias can also be a method that returns a string or DOMElement
        if (key && key.nodeType) {
          return key;
        }

        if(element) {
          if(element.querySelector) {
            return element.querySelector('.' + key + ',#' + key + ',[name="' + key + '"]');
          }
          else {
            var els = element.getElementsByTagName('*'), l = els.length, e, i;
            // find the _first_ best match
            for (i=0; i<l; i++) {
              e = els[i];
              if(e.id === key || e.name === key || e.className.split(' ').indexOf(key) > -1) {
                return e;
              }
            }
          }
        }
      }
    };


    // Allow the caller to overwrite the internals of weld
    for (currentOpKey in ops) {
      if (ops.hasOwnProperty(currentOpKey)) {
        currentOp = ops[currentOpKey];
        fn = config[currentOpKey] || ops[currentOpKey];

        if (debug) {
          fn = debuggable(currentOpKey, fn);
        }

        ops[currentOpKey] = fn;
      }
    }

    // Kick it off
    ops.traverse(null, DOMTarget, null, data);

    if (config.debug) {
      logger.log(DOMTarget.outerHTML);
    }
  };

  if (typeof exports.define !== "undefined" && exports.define.amd) {
    define('weld',[], function() {return window.weld });
  }

})((typeof exports === "undefined") ? window : exports);

