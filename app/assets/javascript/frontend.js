var webclientUI = {
    printHtml : function(html) {
        webclientUI.insertMessage(html);
        //$(".chat").html($(".chat").html() + html + "<br>");
    },

    printMessage : function(msg, html) {
        if (html) {
            return webclientUI.printHtml(msg);
        }

        // if (html) {
        //     msg = webclient.convertImages($("<div>").html(msg)).html();
        // } else {
        msg = utils.escapeHtml(msg);

        if (msg.substr(0, 3) === "***") {
            msg = "<span class='action'>" + msg + "</span>";
        } else if (msg.indexOf(":") !== -1) {
            var pref = msg.substr(0, msg.indexOf(":"));
            var id = -1;
            var auth = 0;
            // id = webclient.players.id(pref);
            // auth = webclient.players.auth(id);

            // if (webclient.players.isIgnored(id)) {
            //     return;
            // }

            if (pref === "~~Server~~") {
                pref = "<span class='server-message'>" + pref + ":</span>";
            } else if (pref === "Welcome Message") {
                pref = "<span class='welcome-message'>" + pref + ":</span>";
            } else if (id === -1) {
                pref = "<span class='script-message'>" + pref + ":</span>";
            } else {
                pref = "<span class='player-message' style='color: " + webclient.players.color(id) + "'>" + utils.rank(auth) + utils.rankStyle(pref + ":", auth) + "</span>";
                this.activateTab();
            }

            //msg = pref + utils.addChannelLinks(msg.slice(msg.indexOf(":") + 1), webclient.channels.channelsByName(true));
            msg = pref + msg.slice(msg.indexOf(":") + 1);
        }

        webclientUI.insertMessage(msg);
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
        $(this).val('');
    }));
});