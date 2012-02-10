Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
  
    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };
  
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
  
    return fBound;
  };


define(function(){

    var requestAnimationFrame = requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    var z = {
        transitions: {
            right: function(fromNode, toNode){
                var width= fromNode.clientWidth;
                toNode.classList.remove('transition');
                toNode.style.left = width + 'px';
                toNode.style.width = width + 'px';
                toNode.classList.add('active');
                fromNode.classList.add('transition');
                requestAnimationFrame(function(){
                    fromNode.style.left = (-width) + 'px';
                    toNode.classList.add('transition');
                    toNode.style.left = '0px';
                }.bind(this));
            },
            left: function(fromNode, toNode){
                var width= fromNode.clientWidth;
                toNode.classList.remove('transition');
                toNode.style.left = (-width) + 'px';
                toNode.style.width = width + 'px';
                toNode.classList.add('active');
                fromNode.classList.add('transition');
                requestAnimationFrame(function(){
                    fromNode.style.left = width + 'px';
                    toNode.classList.add('transition');
                    toNode.style.left = '0px';
                }.bind(this));
            },
            appear: function(fromNode, toNode){
                if(fromNode) fromNode.classList.remove('active');
                toNode.style.left = '0px';
                toNode.style.top = '0px';
                toNode.classList.add('active');
            }
        },
        AppProto: {
            go: function(toView, /* maybe an identifier */ param){
                var transitionName, transition, targetView, waitHandle, fromNode, done;
                transitionName = this.currentView && (this.currentView.transitions[toView] || 'right');
                transition = transitionName ? z.transitions[transitionName] : z.transitions.appear;
                targetView = this.views[toView];
                waitHandle = targetView.activate(param);
                fromNode = this.currentView && this.currentView.domNode;
                done = z.deferred();
                if(waitHandle) this.showActivityIndicator(waitHandle);

                (waitHandle || z.immediately).then(function(){
                        //debugger;
                        console.log('transitioning to view:' + toView);
                        console.log(targetView);
                        transition.call(this, fromNode, targetView.domNode);
                        this.currentView = targetView;
                        console.log(this);
                        done.resolve();
                }.bind(this));
                return done;
                //this.transitionTo(this.views[toView], transition);
            },
            registerView: function(name, definition){
                definition.app = this;
                this.views[name] = z.view(definition);
            },
            registerWidget: function(name, definition){
                this.widgets[name] = z.widget(definition);
            },
            transitionTo: function(view, transition){
                
            },
            activate: function(viewName, param){
                var view = this.views[viewName];
                view.activate(param);
            },
            init: function(rootNode){
                this.domNode = rootNode;
                
                var widgets = Array.apply(null, document.querySelectorAll('[data-widget]') );
                widgets.forEach(function(widgetEl){
                    var type = widgetEl.getAttribute('data-widget');
                    var myInstances = this.domNode.querySelectorAll('[data-widget-type=' + type + ']');

                    require(['./views/' + type], function(widget){
                        if(!widget)
                            console.log('no widget of type:'+ type);
                        widget.templateNode = document.querySelector('[data-widget="' + type + '"]');
                        this.widgets[type] = widget;
                    }.bind(this));
                }.bind(this));

                /*
                for(var widget in this.widgets){
                    if(this.widgets.hasOwnProperty(widget)){
                        this.widgets[widget].templateNode = document.querySelector('[data-widget="' + widget + '"]');
                    }
                }*/

                var views = Array.apply(null,this.domNode.querySelectorAll('[data-view]'));
                views.forEach(function(viewEl){
                    var type = viewEl.getAttribute('data-view');
                    
                    require(['./views/' + type], function(view){
                        this.views[type] = view;
                        view.app = this;
                        view.init( viewEl );
                    }.bind(this));
                }.bind(this));


                
                var children = Array.prototype.slice.call( rootNode.querySelectorAll('[data-view]') );
                var gone = this.go(children[0].getAttribute('data-view'));
                gone.then(function(){
                    rootNode.style.width = this.currentView.clientWidth + 'px';
                    rootNode.style.height = (this.height || this.currentView.clientHeight) + 'px';
                    rootNode.classList.add('z-app');
                }.bind(this));


                console.log('Implement init');
            },
            showActivityIndicator: function(until){
                var size = this.getViewPortDimensions();
                var indicator = document.createElement('div');
                indicator.style.width = size.width + 'px';
                indicator.style.height = size.height + 'px';
                indicator.style.position = 'absolute';
                indicator.style.left = '0px';
                indicator.style.right = '0px';
                indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                indicator.style.display = 'block';
                this.domNode.appendChild(indicator);
                until.then(function(){
                    if(!indicator) return;
                    indicator.parentNode.removeChild(indicator);
                    indicator = null;
                }.bind(this));
            },
            getViewPortDimensions: function(){
                var node = this.currentView ? this.currentView.domNode : this.domNode;
                return {
                    width: node.clientWidth,
                    height: node.clientHeight
                };
            }
        },
        ViewProto: {
            activate: function(param){
                if(this.onActivate){
                    return this.onActivate(param);
                }
            },
            field: function(name){
                return this.domNode.querySelector('[name="' + name + '"]').value;
            },
            init: function(node){
                this.domNode = node;
                for(var selector in this.events){
                    if(this.events.hasOwnProperty(selector)){
                        var actionNode = this.domNode.querySelector(selector);
                        var events = this.events[selector];
                        for(var event in events){
                            var handler = events[event];
                            if(events.hasOwnProperty(event)){
                                actionNode.addEventListener(event,
                                    (typeof handler === 'string' ? this[handler]
                                        : handler).bind(this)
                                );
                            }
                        }
                    }
                }

                if(this.domNode){
                    var widgets = [].slice.call( this.domNode.querySelectorAll('[data-widget-type]') );
                    widgets.forEach(function(w){
                        var widgetRef = w.getAttribute('data-widget-type');
                        var id = w.getAttribute('data-id');
                        require(['./views/' + widgetRef], function(widget){
                            if(!widget) throw new Error('No widget of type: ' + widgetRef + ' is registered in the application');
                            if(id in this.widgets) throw new Error('The widget id ' + id + 'is already registered');
                            
                            this.widgets[id] = widget.instantiate(w);
                        }.bind(this));

                       
                    }.bind(this));
                    //app.widgets.
                }
                

                if(this.onInit) this.onInit();
            },
            databind: function(){
                this.model.then(function(data){
                    weld(this.domNode, data, this.onDatabind ? {map: this.onDatabind} : {});
                }.bind(this));
            },
            widget: function(name){
                var widget = this.widgets[name];
                if(!widget){
                    widget = Z.widget( this.domNode.querySelector('[data-id="' + name + '"]') );
                }
                return widget;
            }
        },
        WidgetProto: {
            init: function(){
                if(this.onInit) this.onInit();
            },
            text: function(text){
                this.domNode.innerText = text;
            },
            instantiate : function(node){
                var instance = Object.create(this);
                instance.domNode = node;
                var html = this.templateNode.innerHTML;
                node.innerHTML = html;
                return instance;
            }
        },
        DeferredProto: {
            resolve: function(val){
                this.value = val;
                this._onResolved.forEach(function(handler){
                    handler.call(null, this.value);
                }.bind(this));
                this._onResolved.splice(0);
            },
            then: function(onResolved){
                this._onResolved.push(onResolved);
                if(this.hasOwnProperty('value')){
                    onResolved.call(null, this.value);
                    this._onResolved.splice(0);
                }
            }
        },
        /* Public API -----------> */
        widget: function(){
            var w = Object.create(this.WidgetProto);
            //w.domNode = node;
            return w;
        },
        view: function(o){
            var view = this._withProto(o, this.ViewProto);
            view.widgets = {};
            return view;
        },
        app: function(obj){
            var app =  this._withProto(obj, this.AppProto);
            app.views = {};
            app.widgets = {};
            return app;
        },
        deferred: function(){
            var d = Object.create(this.DeferredProto);
            d._onResolved = [];
            return d;
        },
        immediately: {
                then: function(what){
                    what();
                }
        },
        /* <---------------------- */
        _withProto: function(obj, proto){
            var o = Object.create(proto);
            this._transferProperties(obj, o);
            return o;
        },
        _transferProperties: function(from,to){
            for(var p in from){
                if(from.hasOwnProperty(p)){
                    to[p] = from[p];
                }
            }
        }
    };
    return z;
});