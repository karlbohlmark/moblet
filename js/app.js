var app = Z.app({ width: 640, height: 920 });

app.registerView('loginView', {
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
                        {cardNumber: '2222 2222 **** 2222', total:'1000kr', status:'Inaktivt'},
                        {cardNumber: '4444 2222 **** 2323', total:'4000kr', status:'Inaktivt'}
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

app.registerView('accountListView', {
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

app.registerView('cardView', {
    model: Z.deferred(),
    onActivate: function(){
        this.databind();
        setTimeout(function(){this.model.resolve({
                cardNumber : '1234 1234 1234 1234',
                cardHolder : 'Johnny Cash',
                reservedAmount: '10 000kr',
                balance: '20 000kr'
            });
        }.bind(this), 1000);
        return this.model;
    }
});

app.registerView('accountView', {
    
});

app.registerWidget('cardChooser', {
    
});

if(document.location.search.indexOf('static')==-1)
    app.init(document.getElementById('z-app'));

/*
if(document.location.search.indexOf('view')!=-1){
    document.getElementById('z-app').style.top = 
}*/

app.server = {
    login: function(ssn, password, cb){
        return cb({success: true});
        $.ajax({ url: '/login' }).then(function(response){
            cb(response);
        });
    }
};
