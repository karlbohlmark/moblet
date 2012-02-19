define(['../z'], function(z){
	return z.widget({
		events: [
			['click', '[data-navigate]', function(e){
				var target = e.target.getAttribute('data-navigate');
					history.go(-1);
					e.preventDefault();
			}]
		],
		onInit: function(e){}
	});
});