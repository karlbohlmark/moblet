define(['../z'], function(z){
	return z.widget({
		events: [
			['click', '.navigation a', function(e){
				var viewNode = $(this.domNode);
				var targetId = e.currentTarget.href.split('#')[1];
				var targetTab = viewNode.find('#' + targetId);
				viewNode.children('div').hide();
				targetTab.show();
				e.preventDefault();
			}]
		],
		onInit: function(e){
			$(this.domNode).children('div:not(:first-child)').hide();
		}
	});
});