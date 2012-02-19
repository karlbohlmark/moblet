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

          return this.model;
        },
        map: {
          '.balance'        : 'card.total',
          '.cardHolder'     : 'card.cardHolder',
          '.reservedAmount' : 'card.reservedAmount',
          '.latestTransactions .transaction': {
            'invoice <- invoices':{
              '.date':'invoice.invoiceDate',
              '.amount': 'invoice.invoiceAmount'
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
        }
    }
  );
});