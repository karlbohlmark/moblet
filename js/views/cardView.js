define(['../z'], function(z){
  return z.view(
    {
        model: z.deferred(),
        transitions: {
            'transactionView': 'right',
            'accountListView': 'left'
        },
        onActivate: function(){
            this.databind();
            setTimeout(function(){
                this.model.resolve({
                    cardNumber : '1234 1234 1234 1234',
                    cardHolder : 'Johnny Cash',
                    reservedAmount: '10 000kr',
                    balance: '20 000kr'
                });
              }.bind(this), 1000);
          return this.model;
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