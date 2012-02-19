define(['./z',
        './views/accountListView',
        './views/loginView',
        './views/transactionView',
        './views/cardView',
        './views/cardChooser'
        ],
    function(z){
        console.log('start');
        var app = z.app({ width: 640, height: 920 });


        if(document.location.search.indexOf('static')==-1)
            app.init(document.getElementById('z-app'));
        

        String.prototype.amount = (function(){
            var thousandSeparate = function(n){
                var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})'),
                sValue=n+'';
                var sep=' ';
                while(sRegExp.test(sValue)) {
                    sValue = sValue.replace(sRegExp, '$1'+sep+'$2');
                }
                return sValue;
            };
            return function(){
                return thousandSeparate(parseFloat(this).toFixed(2)).replace('.', ',');
            };
        })();

        app.server = {
            login: function(ssn, password, cb){
                this.ssn = ssn;
                this.password = password;
                $.ajax({
                    url: '/vbcrest/users/' + ssn,
                    beforeSend: beforeSend
                }).then(function(response){
                    cb({success:true, result: response});
                });
            },
            companyList: function(cb){
              $.ajax({
                    url: '/vbcrest/users/' + this.ssn + '/companies',
                    beforeSend: beforeSend
                }).then(function(response){
                    cb( Array.isArray(response.company) ? response.company : [response.company] );
                });
            },
            accountList: function(orgNr, cb){
              $.ajax({
                    url: '/vbcrest/overview/' + this.ssn + '/' + orgNr,
                    beforeSend: beforeSend
                }).then(function(response){
                    var cards=[], accounts=[];
                    response.overviewItem.forEach(function(account){
                        var obj = {
                            id: account.accountNumber,
                            total: account.availableCreditAmount.amount(),
                            cardHolder: account.cardHolder,
                            reservedAmount: account.reservedAmount.amount(),
                            availableCreditAmount: account.availableCreditAmount.amount(),
                            nonClearedBalance: account.nonClearedBalance.amount(),
                            nonInvoicedAmount: account.nonInvoicedAmount.amount(),
                            creditLimit: account.creditLimit.amount(),
                            active: account.status=='Aktiv'
                        };

                        if(account.kind=='card'){
                            obj.cardNumber = account.accountNumber;
                            cards.push(obj);
                        }else{
                            obj.accountNumber = account.accountNumber;
                            accounts.push(obj);
                        }
                        
                    });
                    var result = {cards: cards, accounts:  accounts };
                    Object.defineProperty(result, 'all', {
                        get: function(){
                            return this.cards.concat(this.accounts);
                        }
                    });
                    cb(result);
                });
            },
            invoices: function(cardNumber, limit, cb){
              $.ajax({
                    url: '/vbcrest/invoices/'+this.ssn+'/'+limit+'/account/'+cardNumber,
                    beforeSend: beforeSend
                }).then(function(response){
                    console.log(response);
                    cb(
                        response.invoice.map(function(invoice){
                            invoice.payedAmount = (invoice.invoiceAmount - invoice.openAmount).toString().amount();
                            invoice.invoiceAmount = invoice.invoiceAmount.amount();
                            return invoice;
                        })
                    );
                });
            }
        };

        var beforeSend= function (xhr){
            var ssn = app.server.ssn;
            var password = app.server.password;
            xhr.setRequestHeader ("Authorization", "Basic " + window.btoa(ssn + ':' + password));
        };

        window.app=app;
        return app;
    }
);

