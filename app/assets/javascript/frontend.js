var webclientUI = {
	printHtml : function(html) {
		$(".chat").html($(".chat").html() + html + "<br>");
	},

	printMessage : function(msg, html) {
		if (html) {
			return webclientUI.printHtml(msg);
		}

		$(".chat").html($(".chat").html() + utils.stripHtml(msg) + "<br>");
	}
};

$(function() {

});