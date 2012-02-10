define(['../z'], function(z){
	return z.view(
		{
			events: {},
			model: z.deferred(),
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
		}
	);
});