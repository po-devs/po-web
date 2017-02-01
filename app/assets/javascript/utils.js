export function toAlphanumeric(text) {
    return ("" + text).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// https://github.com/isaacs/inherits/blob/master/inherits_browser.js
export function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

export function queryField(key, defaultStr, query) {
    var match = new RegExp("[?&]" + key + "=([^&]*)")
        .exec(query || window.location.search);
    return (match && decodeURIComponent(match[1].replace(/\+/g, " "))) || defaultStr;
}

// HTML utilities
export function escapeHtmlQuotes(str) {
    return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\b((?:https?|ftp):\/\/\S+)/gi, "<a href='$1' target='_blank'>$1</a>")
        .replace(/&amp;(?=[^\s<]*<\/a>)/g, "&"); // Revert &amp;'s to &'s in URLs
}

export function stripHtml(str) {
    return str.replace(/<\/?[^>]*>/g, "");
}

// Add an option for UTC dates too?
// And AM/PM (date.getHours() < x)
export function addDatePadding(date) {
    var str = date.toString();
    return date < 10 ? "0" + str : str;
}

export function timestamp() {
    var date = new Date();
    return addDatePadding(date.getHours()) + ":" +
        addDatePadding(date.getMinutes()) + ":" +
        addDatePadding(date.getSeconds());
}

// channelNames must be a list of lowercase names
export function addChannelLinks(line, channelNames) {
    var index = line.indexOf("#");
    if (index === -1) {
        return line;
    }

    var str = "", fullChanName, chanName, chr, lastIndex = 0, pos, i;
    while (index !== -1) {
        str += line.substring(lastIndex, index);
        lastIndex = index + 1; // Skip over the '#'

        fullChanName = "";
        chanName = "";

        for (i = 0, pos = lastIndex; i < 20 && (chr = line[pos]); i += 1, pos += 1) {
            fullChanName += chr;
            if (channelNames.indexOf(fullChanName.toLowerCase()) !== -1) {
                chanName = fullChanName;
            }
        }

        if (chanName) {
            str += "<a href='po:join/" + chanName + "'>#" + chanName + "</a>";
            lastIndex += chanName.length;
        } else {
            str += "#";
        }

        index = line.indexOf("#", lastIndex);
    }

    if (lastIndex < line.length) {
        str += line.substr(lastIndex);
    }

    return str;
}

export function unenumerable(obj, key, value) {
    if (!obj.hasOwnProperty(key)) {
        // Enumerable, writable, configurable are false
        Object.defineProperty(obj, key, {
            value: value
        });
    }
}

export function rank(auth, set) {
    set = set || rankSet;
    auth = Math.max(0, Math.min(4, auth));
    return set[auth] || "";
}

export function rankStyle(str, auth, set) {
    set = set || rankStyleSet;
    auth = Math.max(0, Math.min(4, auth));
    return (set[auth] || "").replace(/\{name\}/gi, str);
}

// Shorthand for if (event.which === 13) { callback(); }
export function onEnterPressed(callback) {
    return function (event) {
        if (event.which === 13) {
            callback.call(this, event);
        }
    };
}

// User, Mod, Admin, Owner, Hidden
export const rankSet = ["", "+", "+", "+", ""];
export const rankStyleSet = [
    "{name}", "<i>{name}</i>", "<i>{name}</i>", "<i>{name}</i>", "{name}"
];

unenumerable(String.prototype, "contains", function (needle) {
    return this.indexOf(needle) > -1;
});

/* Fast index search in a sorted array */
unenumerable(Array.prototype, "dichotomy", function (func) {
    if (this.length === 0) {
        return 0;
    }

    var min = 0;
    var max = this.length - 1;

    while (true) {
        var half = Math.floor(min + (max - min) / 2);

        var cmp = func(this[half]);
        if (min === max) {
            return half + (cmp > 0 ? 1 : 0);
        }

        if (cmp < 0) {
            max = half;
        } else if (cmp > 0) {
            min = (min === half ? max : half);
        } else {
            return half;
        }
    }
});

unenumerable(String.prototype, "startsWith", function(str) {
    return this.lastIndexOf(str, 0) === 0;
});

window.isActive = true;

$(window).focus(function() {
    window.isActive = true;
});

$(window).blur(function() {
    window.isActive = false;
});

/* Add a preventDefault on stopPropagation in order to avoid
 on FF a click on a player element that won't be handled by our handler
 because of the e.stopPropagation() that would've happened. */
 $(function() {
    if (!$.fn.contextmenu.Constructor) {
        return;
    }
    var ctx = $.fn.contextmenu.Constructor.prototype;
    var ctxcm = ctx.closemenu;
    ctx.closemenu = function(e) {
        var x;
        if (e) {
            x = e.stopPropagation;
            e.stopPropagation = function () {
                x.call(e);
                e.preventDefault();
            }
        }

        ctxcm.call(this, e);

        if (e) {
            e.stopPropagation = x;
        }
    };
 });
