 define(['../z'], function(z){
    return z.view({
        events: {
            '#btnLogin': { click: 'submitLogin' }
        },
        transitions: {
            'accountList': 'right'
        },
        submitLogin : function(){
            this.app.server.login(this.field('ssn'), this.field('password'), this.onLoginAttempt.bind(this));
        },
        onLoginAttempt : function(result){
            if(result.success){
                this.clearError();
                
                this.app.server.companyList(function(companies){
                    this.app.server.accountList(companies[0].organizationNumber, function(accountList){
                        this.app.views.accountListView.model.resolve(accountList);
                        this.app.go('accountListView');
                    });
                });

                
                // todo: remove
                /*
                setTimeout(function(){
                    
                    this.app.views.accountListView.model.resolve({
                        cards:[
                            {cardNumber: '1234 1234 **** 1234', total:'1000kr', status:'Aktivt'},
                            {cardNumber: '2222 2222 **** 2222', total:'1000kr', status:'Inaktivt'},
                            {cardNumber: '4444 2222 **** 2323', total:'4000kr', status:'Inaktivt'}
                        ],
                        accounts:[{accountNumber: '1234 1234 1234 1234'}]});
                    this.app.go('accountListView');
                }.bind(this),300);
                */
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
});