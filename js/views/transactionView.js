define(['../z'], function(z){
	return z.view({
		transitions: {
			'cardView': 'left'
		},
        afterInit: function(){
          //this.widgets.navBar.set('title', 'Transaktion');
        }
	});
});

