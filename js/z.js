define(function(){
    if (!Function.prototype.bind) {
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
    }


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
            go: function(toView, /* maybe an identifier */ param, skipPushState){
                var transitionName, transition, targetView, waitHandle, fromNode, done;
                transitionName = this.currentView && (this.currentView.transitions[toView] || 'right');
                transition = transitionName ? z.transitions[transitionName] : z.transitions.appear;
                targetView = this.views[toView];
                waitHandle = targetView.activate(param);
                fromNode = this.currentView && this.currentView.domNode;
                done = z.deferred();
                if(waitHandle) this.showActivityIndicator(waitHandle);

                (waitHandle || z.immediately).then(function(){
                        console.log('transitioning to view:' + toView);
                        console.log(targetView);
                        transition.call(this, fromNode, targetView.domNode);
                        this.currentView = targetView;
                        if(!skipPushState)
                            history.pushState(null, null,'/' + toView + (!param? '' : '/' + param));
                        done.resolve();
                }.bind(this));
                return done;
            },
            transitionTo: function(view, transition){
                
            },
            activate: function(viewName, param){
                var view = this.views[viewName];
                view.activate(param);
            },
            init: function(rootNode){
                this.domNode = rootNode;
                
                var widgets = [].slice.call( document.querySelectorAll('[data-widget]') );
                
                widgets.forEach(function(widgetEl){
                    console.log(typeof widgetEl);
                    var type = widgetEl.getAttribute('data-widget');
                    var myInstances = this.domNode.querySelectorAll('[data-widget-type=' + type + ']');
                    
                    require(['./views/' + type], function(widget){
                        if(!widget)
                            console.log('no widget of type:'+ type);
                        widget.templateNode = document.querySelector('[data-widget="' + type + '"]');
                        this.widgets[type] = widget;
                    }.bind(this));
                }.bind(this));
                
                var views = [].slice.call(this.domNode.querySelectorAll('[data-view]'));
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

                var gotFirstPop = false;
                window.onpopstate = function(){
                    window.onpopstate = function(event){
                        if(document.location.pathname.length>1){
                            var path = document.location.pathname.slice(1);
                            this.go(path.split('/')[0], null, true);
                        }
                    }.bind(this);
                }.bind(this);

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
                if(typeof(this.events=='object') && !Array.isArray(this.events)){
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
                } else if(Array.isArray(this.events)){
                    z.WidgetProto.applyEvents.apply(this);
                }

                this.initWidgets();

                if(this.onInit) this.onInit();
            },
            initWidgets: function(){
                if(this.domNode){
                    var widgets = [].slice.call( this.domNode.querySelectorAll('[data-widget-type]') );
                    var j = join();
                    widgets.forEach(function(w){
                        var widgetRef = w.getAttribute('data-widget-type');
                        var id = w.getAttribute('data-id');
                        var cb = j();
                        require(['./views/' + widgetRef], function(widget){
                            if(!widget) throw new Error('No widget of type: ' + widgetRef + ' is registered in the application');
                            //if(id in this.widgets) throw new Error('The widget id ' + id + ' is already registered');
                            
                            var instance = widget.instantiate(w);
                            instance.app = this.app;

                            this.widgets[id] = instance;
                            cb(instance);
                        }.bind(this));
                    }.bind(this));

                    j.results(function(){
                        if(this.afterInit) this.afterInit();
                    }.bind(this));
                }
            },
            databind: function(){
                this.model.then(function(data){
                    //var result = Plates.bind(this.domNode.innerHTML, data, this.map);
                    //this.domNode.innerHTML = result;
                    //weld(this.domNode, data, this.onDatabind ? {map: this.onDatabind} : {});
                    if(!this.templateNode)
                        this.templateNode = this.domNode.cloneNode(true);
                    var clone = this.templateNode.cloneNode(true);
                    var results = $(clone).render(data, this.map);
                    this.domNode.innerHTML = results[0].innerHTML;

                    z.WidgetProto.applyEvents.apply(this);
                    this.initWidgets();
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
                this.applyEvents();
                if(this.onInit) this.onInit();
            },
            applyEvents: function(){
                if(this.events){
                    this.events.forEach(function(eventReg){
                        var name     = eventReg[0],
                            selector = eventReg[1],
                            handler  = eventReg[2];
                            $(this.domNode).on(name, selector, handler.bind(this));
                    }.bind(this));
                }
            },
            text: function(text){
                this.domNode.innerText = text;
            },
            set: function(field, value){
                var f = this.domNode.querySelector('[data-name=' + field + ']');
                if(f.tagName == 'INPUT'){
                    f.value = value;
                    return;
                }
                f.innerHTML = value;
            },
            //create an instance of this widget in given dom node
            instantiate : function(node){
                var instance = Object.create(this),html;
                instance.domNode = node;
                if(this.templateNode){
                    html = this.templateNode.innerHTML;
                    node.innerHTML = html;
                }
                var attrs = Array.prototype.slice.call(instance.domNode.attributes);
                attrs.forEach(function(attr){
                    if(/^data-prop.*/.test( attr.name ) ){
                        instance.set(attr.name.split('-')[2], attr.value);
                    }
                }.bind(this));
                
                instance.init();
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
            },
            reset: function(){
                delete this.value;
            }
        },
        /* Public API -----------> */
        widget: function(o){
            var w = this._withProto(o, this.WidgetProto);
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
            app.history = [];
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