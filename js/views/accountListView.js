define(['../z'], function(z){
	return z.view(
		{
			events: [
				['mousedown', '.card, .account', function(e){
					$(e.currentTarget).addClass('active-state');
				}],
				['mouseup', '.card, .account', function(e){
					var target = $('.active-state', this.domNode).removeClass('active-state');
					if(target.length){
						var view = $(e.currentTarget).is('.account') ? 'accountView' : 'cardView';
						this.app.go(view, target.attr('data-id'));
					}
				}]
			],
			model: z.deferred(),
			transitions: {
				'loginView': 'left'
			},
			onActivate: function(){
				this.databind();
			},
			map: {
				'.cardsTitle@class+': function(arg){
					return arg.context.cards.length ? '' : ' hidden';
				},
				'.accountsTitle@class+': function(arg){
					return arg.context.accounts.length ? '' : ' hidden';
				},
				'.cards .card': {
					'c <- cards': {
						'.cardNumber': 'c.cardNumber',
						'.total': 'c.total',
						'@data-id': 'c.cardNumber'
					}
				},
				'.accounts .account': {
					'a <- accounts': {
						'.accountNumber': 'a.accountNumber',
						'.total': 'a.total',
						'@data-id': 'a.accountNumber'
					}
				}
			}
		}
	);
});