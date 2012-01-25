var App = Em.Application.create();

App.server = {}
App.server.login = function(ssn, password, cb){
    cb({
        success: true
    });
};

App.loginController = Ember.Object.create({
    ssn: '',
    password: '',

    login: function(){
        App.server.login(this.ssn, this.password, function(result){
           console.log(result);
        });
    }
});

App.LoginView = Em.View.extend({});
