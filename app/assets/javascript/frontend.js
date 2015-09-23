var webclientUI = {
    printHtml : function(html) {
        webclientUI.insertMessage(html);
        //$(".chat").html($(".chat").html() + html + "<br>");
    },

    printMessage : function(msg, html) {
        if (html) {
            return webclientUI.printHtml(msg);
        }

        webclientUI.insertMessage(utils.stripHtml(msg));
        //$(".chat").html($(".chat").html() + utils.stripHtml(msg) + "<br>");
    },

    insertMessage : function (msg, opts) {
        var chatTextArea = $(".chat"),
            cta = chatTextArea[0],
            scrollDown = cta.scrollTop >= cta.scrollHeight - cta.offsetHeight,
            timestampPart;

        opts = opts || {};

        if (opts.timestamps) {
            timestampPart = "<span class='timestamp-enabled" + (poStorage(opts.timestampCheck, 'boolean') ? ' timestamp' : '') + "'>" + utils.timestamp() + "</span>";
            if (opts.html) {
                msg = msg.replace(timestampRegex, timestampPart);
            } else if (msg) {
                msg += timestampPart;
            }
        }

        if (opts.linebreak !== false) {
            msg += "<br/>";
        }

        chatTextArea.append("<div class='chat-line'>" + msg + "</div>");

        /* Limit number of lines */
        // if (this.chatCount++ % 500 === 0) {
        //     chatTextArea.html(chatTextArea.find(".chat-line").slice(-500));
        // }

        if (scrollDown) {
            chatTextArea.animate({scrollTop: cta.scrollHeight}, "fast");
        }
    }
};

$(function() {
    $("#chatInput").keydown(utils.onEnterPressed(function () {
        webclient.sendMessage($(this).val(), 0);
    }));
});