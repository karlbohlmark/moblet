var app = Z.app({ width: 640, height: 920 });

app.views.loginView = Z.view({
    events: {
        '#btnLogin': { click: 'submitLogin' }
    },
    transitions: {
        'accountList': 'right'
    },
    submitLogin : function(){
        app.server.login(this.field('ssn'), this.field('password'), this.onLoginAttempt.bind(this));
    },
    onLoginAttempt : function(result){
        if(result.success){
            this.clearError();
            
            // todo: remove
            setTimeout(function(){
                
                app.views.accountListView.model.resolve({
                    cards:[
                        {cardNumber: '1234 1234 **** 1234', total:'1000kr', status:'Aktivt'},
                        {cardNumber: '2222 2222 **** 2222', total:'1000kr', status:'Inaktivt'}
                    ],
                    accounts:[{accountNumber: '1234 1234 1234 1234'}]});
                app.go('accountListView');
            },300);
            // /todo

        }else{
            this.setError("Sorry, login failed");
        }
    },
    setError: function(error){
        //this.widget('error').text(error);
    },
    clearError: function(){
        //this.widget('error').text('');
    }
});

app.views.accountListView = Z.view({
    events: {},
    model: Z.deferred(),
    transitions: {
        'loginView': 'left'
    },
    onActivate: function(){
        this.databind();
    },
    onInit: function(){
        this.domNode.addEventListener('mouseup', function(){
           var target = $('.active-state', this.domNode).removeClass('active-state');
           if(target.length){
               app.go('cardView', target.attr('data-id'));
           }
        }.bind(this));
        this.domNode.addEventListener('mousedown', function(e){
           var card = $(e.target).closest('.card');
           card.addClass('active-state');
        }.bind(this));
    },
    onDatabind: function(parent, element, key, val){
        switch( key ){
            case 'cardNumber':
                $(element).closest('.card').attr('data-id', val);
                break;
            case 'accountNumber':
                $(element).closest('.account').attr('data-id', val);
            break;
            default:
        }
    }
});

app.views.cardView = Z.view({
    model: Z.deferred(),
    onActivate: function(){
        this.databind();
        setTimeout(function(){this.model.resolve({cardNumber : 'asdf', cardHolder : 'card cardHolder'});}.bind(this), 1000);
    }
});

app.views.accountView = Z.view({
    
});

app.widgets.cardChooser = Z.widget({
    
});

app.init(document.getElementById('z-app'));

app.server = {
    login: function(ssn, password, cb){
        return cb({success: true});
        $.ajax({ url: '/login' }).then(function(response){
            cb(response);
        });
    }
};
