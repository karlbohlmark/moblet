define(['../z'], function(z){
  return z.view(
    {
        model: z.deferred(),
        transitions: {
            'transactionView': 'right',
            'accountListView': 'left'
        },
        onActivate: function(param){
            console.log('Activate cardview with param: ' +param);
            var found = this.app.views.accountListView.model.value.all.filter(function(acc){
              return acc.cardNumber == param || acc.accountNumber == param;
            });

            var card = found[0];

            this.model.reset();
            this.app.server.invoices(card.id, 2, function(invoices){
              this.model.resolve({card:card, invoices:invoices});
              this.databind();
            }.bind(this));
            
            /*
            setTimeout(function(){
                this.model.resolve({
                    cardNumber : '1234 1234 1234 1234',
                    cardHolder : 'Johnny Cash',
                    reservedAmount: '10 000kr',
                    balance: '20 000kr'
                });
              }.bind(this), 1000);
              */
          return this.model;
        },
        map: {
          '.cardHolder'         : 'card.cardHolder',
          '.reservedAmount'     : 'card.reservedAmount',
          '.creditLimit'        : 'card.creditLimit',
          '.nonInvoicedAmount'  : 'card.nonInvoicedAmount',
          '.nonClearedBalance'  : 'card.nonClearedBalance',
          '.availableCreditAmount'  : 'card.availableCreditAmount',
          '.latestInvoices .invoiceRow': {
            'invoice <- invoices':{
              '.invoiceDate':'invoice.invoiceDate',
              '.date':'invoice.dueDate',
              '.amount': 'invoice.invoiceAmount',
              '.payedAmount': 'invoice.payedAmount',
              '.ocr': 'invoice.ocrNumber'
            }
          }
        },
        onInit: function(){
            this.domNode.addEventListener('mouseup', function(){
               var target = $('.active-state', this.domNode).removeClass('active-state');
               if(target.length){
                   app.go('transactionView', target.attr('data-id'));
               }
            }.bind(this));
            this.domNode.addEventListener('mousedown', function(e){
               var transaction = $(e.target).closest('.transaction');
               transaction.addClass('active-state');
            }.bind(this));
        },
        afterInit: function(){
          //this.widgets.navBar.set('title', 'Kort');
        }
    }
  );
});