var chatHtml = 
'    <div class="chat" tabindex=3>\
     \
    </div>\
\
    <div class="chatInputContainer">\
      <input type="text" class="form-control chatInput" placeholder="Type your message...">\
    </div>';

function Chat() {
    $.observable(this);

    this.element = $("<div class='flex-column'>").html(chatHtml);
    this.chatTextArea = this.element.find(".chat");
    this.chatSend = this.element.find(".chatInput");

    var self = this;
    this.chatSend.keydown(utils.onEnterPressed(function () {
        self.trigger("chat", $(this).val());
        $(this).val('');
    }));
};

Chat.prototype.insertMessage = function (msg, opts) {
    var chatTextArea = this.chatTextArea;
    var cta = chatTextArea[0];
    var scrollDown = cta.scrollTop >= cta.scrollHeight - cta.offsetHeight;
    var timestampPart;

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
};