var chatHtml =
'    <div class="chat">\
     \
    </div>\
\
    <div class="chatInputContainer">\
      <input type="text" class="form-control chatInput" placeholder="Type your message..." history>\
    </div>';

// At least Chrome (I assume other browsers do the same) expand <timestamp/> to <timestamp><timestamp/> (as it is an unknown element).
var timestampRegex = /<timestamp *\/ *>|<timestamp><\/timestamp>/gi;

function Chat(options) {
    $.observable(this);

    this.element = $("<div class='flex-column chat-column'>").html(chatHtml);
    if (webclientUI.players.showColors) {
        this.element.addClass("rainbow");
    }
    this.chatTextArea = this.element.find(".chat");
    this.chatSend = this.element.find(".chatInput");
    this.chatCount = 0;

    if (options && options.findbattle) {
        this.element.find(".chatInputContainer").addClass("input-group").prepend("<span class='input-group-btn' title='Find battle'><a href='po:findbattle/' class='btn btn-default'><span class='glyphicon glyphicon-fire'></span><span class='hidden-xs hidden-sm'> Find Battle</span></a></span>");
    }

    var self = this;
    this.chatSend.keydown(utils.onEnterPressed(function () {
        if ($(this).val().length > 0) {
            self.trigger("chat", $(this).val());
        }
        //$(this).val('');
    }));
}

Chat.prototype.disable = function() {
    this.chatSend.prop("disabled", true);
};

Chat.prototype.insertMessage = function (msg, opts) {
    var chatTextArea = this.chatTextArea;
    var cta = chatTextArea[0];
    var scrollDown = cta.scrollTop >= cta.scrollHeight - cta.offsetHeight;
    var timestampPart;

    opts = opts || {};

    if (opts.timestamps) {
        timestampPart = "<span class='timestamp'>(" + utils.timestamp() + ")</span> ";
        if (opts.html) {
            msg = msg.replace(timestampRegex, timestampPart);
        } else if (msg) {
            msg = timestampPart + msg;
        }
    }

    if (opts.linebreak) {
        msg += "<br/>";
    }

    chatTextArea.append("<div class='chat-line'>" + msg + "</div>");

    /* Limit number of lines */
    if (this.chatCount++ % 500 === 0) {
        chatTextArea.html(chatTextArea.find(".chat-line").slice(-500));
    }

    if (scrollDown) {
        this.scrollDown();
    }
};

Chat.prototype.scrollDown = function() {
    this.chatTextArea.finish().animate({scrollTop: this.chatTextArea[0].scrollHeight}, "fast");
};

$(function () {
    var maxHistSize = 100;
    $(document).on("keydown", "[history]", function (event) {
        var elem = event.currentTarget;

        elem.hist = elem.hist || [];
        elem.histIndex = elem.histIndex || 0;
        if (event.which === 38) { // Up
            if (elem.histIndex === elem.hist.length && elem.value.match(/\S/)) {
                elem.hist.push(elem.value);
                if (elem.hist.length > maxHistSize) {
                    elem.hist.shift();
                }
            }
            if (elem.histIndex > 0) {
                elem.value = elem.hist[--elem.histIndex];
            }
        } else if (event.which === 40) { // Down
            if (elem.histIndex < elem.hist.length) {
                elem.value = elem.hist[++elem.histIndex] || "";
            }
        } else if (event.which === 13) { // Return
            if (!elem.value.length) {
                return;
            }
            elem.hist.push(elem.value);
            if (elem.hist.length > maxHistSize) {
                elem.hist.shift();
            }
            elem.histIndex = elem.hist.length;
            elem.value = "";
        }
    });
});
