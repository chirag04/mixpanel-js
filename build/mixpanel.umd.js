(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.mixpanel = factory());
}(this, function () { 'use strict';

    var Config = {
        DEBUG: false,
        LIB_VERSION: '2.22.4'
    };

    // since es6 imports are static and we run unit tests from the console, window won't be defined when importing this file
    var win;
    if (typeof(window) === 'undefined') {
        var loc = {
            hostname: ''
        };
        win = {
            navigator: { userAgent: '' },
            document: {
                location: loc,
                referrer: ''
            },
            screen: { width: 0, height: 0 },
            location: loc
        };
    } else {
        win = window;
    }



    /*
     * Saved references to long variable names, so that closure compiler can
     * minimize file size.
     */

    var ArrayProto = Array.prototype;
    var FuncProto = Function.prototype;
    var ObjProto = Object.prototype;
    var slice = ArrayProto.slice;
    var toString = ObjProto.toString;
    var hasOwnProperty = ObjProto.hasOwnProperty;
    var windowConsole = win.console;
    var navigator = win.navigator;
    var document = win.document;
    var windowOpera = win.opera;
    var screen = win.screen;
    var userAgent = navigator.userAgent;
    var nativeBind = FuncProto.bind;
    var nativeForEach = ArrayProto.forEach;
    var nativeIndexOf = ArrayProto.indexOf;
    var nativeIsArray = Array.isArray;
    var breaker = {};
    var _ = {
        trim: function(str) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };

    // Console override
    var console = {
        /** @type {function(...[*])} */
        log: function() {
            if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                try {
                    windowConsole.log.apply(windowConsole, arguments);
                } catch (err) {
                    _.each(arguments, function(arg) {
                        windowConsole.log(arg);
                    });
                }
            }
        },
        /** @type {function(...[*])} */
        error: function() {
            if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                var args = ['Mixpanel error:'].concat(_.toArray(arguments));
                try {
                    windowConsole.error.apply(windowConsole, args);
                } catch (err) {
                    _.each(args, function(arg) {
                        windowConsole.error(arg);
                    });
                }
            }
        },
        /** @type {function(...[*])} */
        critical: function() {
            if (!_.isUndefined(windowConsole) && windowConsole) {
                var args = ['Mixpanel error:'].concat(_.toArray(arguments));
                try {
                    windowConsole.error.apply(windowConsole, args);
                } catch (err) {
                    _.each(args, function(arg) {
                        windowConsole.error(arg);
                    });
                }
            }
        }
    };


    // UNDERSCORE
    // Embed part of the Underscore Library
    _.bind = function(func, context) {
        var args, bound;
        if (nativeBind && func.bind === nativeBind) {
            return nativeBind.apply(func, slice.call(arguments, 1));
        }
        if (!_.isFunction(func)) {
            throw new TypeError();
        }
        args = slice.call(arguments, 2);
        bound = function() {
            if (!(this instanceof bound)) {
                return func.apply(context, args.concat(slice.call(arguments)));
            }
            var ctor = {};
            ctor.prototype = func.prototype;
            var self = new ctor();
            ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) {
                return result;
            }
            return self;
        };
        return bound;
    };

    _.bind_instance_methods = function(obj) {
        for (var func in obj) {
            if (typeof(obj[func]) === 'function') {
                obj[func] = _.bind(obj[func], obj);
            }
        }
    };

    /**
     * @param {*=} obj
     * @param {function(...[*])=} iterator
     * @param {Object=} context
     */
    _.each = function(obj, iterator, context) {
        if (obj === null || obj === undefined) {
            return;
        }
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    };

    _.escapeHTML = function(s) {
        var escaped = s;
        if (escaped && _.isString(escaped)) {
            escaped = escaped
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        return escaped;
    };

    _.extend = function(obj) {
        _.each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                if (source[prop] !== void 0) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };

    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

    // from a comment on http://dbj.org/dbj/?p=286
    // fails on only one very rare and deliberate custom object:
    // var bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
    _.isFunction = function(f) {
        try {
            return /^\s*\bfunction\b/.test(f);
        } catch (x) {
            return false;
        }
    };

    _.isArguments = function(obj) {
        return !!(obj && hasOwnProperty.call(obj, 'callee'));
    };

    _.toArray = function(iterable) {
        if (!iterable) {
            return [];
        }
        if (iterable.toArray) {
            return iterable.toArray();
        }
        if (_.isArray(iterable)) {
            return slice.call(iterable);
        }
        if (_.isArguments(iterable)) {
            return slice.call(iterable);
        }
        return _.values(iterable);
    };

    _.keys = function(obj) {
        var results = [];
        if (obj === null) {
            return results;
        }
        _.each(obj, function(value, key) {
            results[results.length] = key;
        });
        return results;
    };

    _.values = function(obj) {
        var results = [];
        if (obj === null) {
            return results;
        }
        _.each(obj, function(value) {
            results[results.length] = value;
        });
        return results;
    };

    _.identity = function(value) {
        return value;
    };

    _.include = function(obj, target) {
        var found = false;
        if (obj === null) {
            return found;
        }
        if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
            return obj.indexOf(target) != -1;
        }
        _.each(obj, function(value) {
            if (found || (found = (value === target))) {
                return breaker;
            }
        });
        return found;
    };

    _.includes = function(str, needle) {
        return str.indexOf(needle) !== -1;
    };

    // Underscore Addons
    _.inherit = function(subclass, superclass) {
        subclass.prototype = new superclass();
        subclass.prototype.constructor = subclass;
        subclass.superclass = superclass.prototype;
        return subclass;
    };

    _.isObject = function(obj) {
        return (obj === Object(obj) && !_.isArray(obj));
    };

    _.isEmptyObject = function(obj) {
        if (_.isObject(obj)) {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    _.isString = function(obj) {
        return toString.call(obj) == '[object String]';
    };

    _.isDate = function(obj) {
        return toString.call(obj) == '[object Date]';
    };

    _.isNumber = function(obj) {
        return toString.call(obj) == '[object Number]';
    };

    _.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    _.encodeDates = function(obj) {
        _.each(obj, function(v, k) {
            if (_.isDate(v)) {
                obj[k] = _.formatDate(v);
            } else if (_.isObject(v)) {
                obj[k] = _.encodeDates(v); // recurse
            }
        });
        return obj;
    };

    _.timestamp = function() {
        Date.now = Date.now || function() {
            return +new Date;
        };
        return Date.now();
    };

    _.formatDate = function(d) {
        // YYYY-MM-DDTHH:MM:SS in UTC
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }
        return d.getUTCFullYear() + '-' +
            pad(d.getUTCMonth() + 1) + '-' +
            pad(d.getUTCDate()) + 'T' +
            pad(d.getUTCHours()) + ':' +
            pad(d.getUTCMinutes()) + ':' +
            pad(d.getUTCSeconds());
    };

    _.safewrap = function(f) {
        return function() {
            try {
                return f.apply(this, arguments);
            } catch (e) {
                console.critical('Implementation error. Please turn on debug and contact support@mixpanel.com.');
                if (Config.DEBUG){
                    console.critical(e);
                }
            }
        };
    };

    _.safewrap_class = function(klass, functions) {
        for (var i = 0; i < functions.length; i++) {
            klass.prototype[functions[i]] = _.safewrap(klass.prototype[functions[i]]);
        }
    };

    _.safewrap_instance_methods = function(obj) {
        for (var func in obj) {
            if (typeof(obj[func]) === 'function') {
                obj[func] = _.safewrap(obj[func]);
            }
        }
    };

    _.strip_empty_properties = function(p) {
        var ret = {};
        _.each(p, function(v, k) {
            if (_.isString(v) && v.length > 0) {
                ret[k] = v;
            }
        });
        return ret;
    };

    /*
     * this function returns a copy of object after truncating it.  If
     * passed an Array or Object it will iterate through obj and
     * truncate all the values recursively.
     */
    _.truncate = function(obj, length) {
        var ret;

        if (typeof(obj) === 'string') {
            ret = obj.slice(0, length);
        } else if (_.isArray(obj)) {
            ret = [];
            _.each(obj, function(val) {
                ret.push(_.truncate(val, length));
            });
        } else if (_.isObject(obj)) {
            ret = {};
            _.each(obj, function(val, key) {
                ret[key] = _.truncate(val, length);
            });
        } else {
            ret = obj;
        }

        return ret;
    };

    _.JSONEncode = (function() {
        return function(mixed_val) {
            var value = mixed_val;
            var quote = function(string) {
                var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; // eslint-disable-line no-control-regex
                var meta = { // table of character substitutions
                    '\b': '\\b',
                    '\t': '\\t',
                    '\n': '\\n',
                    '\f': '\\f',
                    '\r': '\\r',
                    '"': '\\"',
                    '\\': '\\\\'
                };

                escapable.lastIndex = 0;
                return escapable.test(string) ?
                    '"' + string.replace(escapable, function(a) {
                        var c = meta[a];
                        return typeof c === 'string' ? c :
                            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    }) + '"' :
                    '"' + string + '"';
            };

            var str = function(key, holder) {
                var gap = '';
                var indent = '    ';
                var i = 0; // The loop counter.
                var k = ''; // The member key.
                var v = ''; // The member value.
                var length = 0;
                var mind = gap;
                var partial = [];
                var value = holder[key];

                // If the value has a toJSON method, call it to obtain a replacement value.
                if (value && typeof value === 'object' &&
                    typeof value.toJSON === 'function') {
                    value = value.toJSON(key);
                }

                // What happens next depends on the value's type.
                switch (typeof value) {
                    case 'string':
                        return quote(value);

                    case 'number':
                        // JSON numbers must be finite. Encode non-finite numbers as null.
                        return isFinite(value) ? String(value) : 'null';

                    case 'boolean':
                    case 'null':
                        // If the value is a boolean or null, convert it to a string. Note:
                        // typeof null does not produce 'null'. The case is included here in
                        // the remote chance that this gets fixed someday.

                        return String(value);

                    case 'object':
                        // If the type is 'object', we might be dealing with an object or an array or
                        // null.
                        // Due to a specification blunder in ECMAScript, typeof null is 'object',
                        // so watch out for that case.
                        if (!value) {
                            return 'null';
                        }

                        // Make an array to hold the partial results of stringifying this object value.
                        gap += indent;
                        partial = [];

                        // Is the value an array?
                        if (toString.apply(value) === '[object Array]') {
                            // The value is an array. Stringify every element. Use null as a placeholder
                            // for non-JSON values.

                            length = value.length;
                            for (i = 0; i < length; i += 1) {
                                partial[i] = str(i, value) || 'null';
                            }

                            // Join all of the elements together, separated with commas, and wrap them in
                            // brackets.
                            v = partial.length === 0 ? '[]' :
                                gap ? '[\n' + gap +
                                partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                                '[' + partial.join(',') + ']';
                            gap = mind;
                            return v;
                        }

                        // Iterate through all of the keys in the object.
                        for (k in value) {
                            if (hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }

                        // Join all of the member texts together, separated with commas,
                        // and wrap them in braces.
                        v = partial.length === 0 ? '{}' :
                            gap ? '{' + partial.join(',') + '' +
                            mind + '}' : '{' + partial.join(',') + '}';
                        gap = mind;
                        return v;
                }
            };

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str('', {
                '': value
            });
        };
    })();

    /**
     * From https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
     * Slightly modified to throw a real Error rather than a POJO
     */
    _.JSONDecode = (function() {
        var at, // The index of the current character
            ch, // The current character
            escapee = {
                '"': '"',
                '\\': '\\',
                '/': '/',
                'b': '\b',
                'f': '\f',
                'n': '\n',
                'r': '\r',
                't': '\t'
            },
            text,
            error = function(m) {
                var e = new SyntaxError(m);
                e.at = at;
                e.text = text;
                throw e;
            },
            next = function(c) {
                // If a c parameter is provided, verify that it matches the current character.
                if (c && c !== ch) {
                    error('Expected \'' + c + '\' instead of \'' + ch + '\'');
                }
                // Get the next character. When there are no more characters,
                // return the empty string.
                ch = text.charAt(at);
                at += 1;
                return ch;
            },
            number = function() {
                // Parse a number value.
                var number,
                    string = '';

                if (ch === '-') {
                    string = '-';
                    next('-');
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
                if (ch === '.') {
                    string += '.';
                    while (next() && ch >= '0' && ch <= '9') {
                        string += ch;
                    }
                }
                if (ch === 'e' || ch === 'E') {
                    string += ch;
                    next();
                    if (ch === '-' || ch === '+') {
                        string += ch;
                        next();
                    }
                    while (ch >= '0' && ch <= '9') {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (!isFinite(number)) {
                    error('Bad number');
                } else {
                    return number;
                }
            },

            string = function() {
                // Parse a string value.
                var hex,
                    i,
                    string = '',
                    uffff;
                // When parsing for string values, we must look for " and \ characters.
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return string;
                        }
                        if (ch === '\\') {
                            next();
                            if (ch === 'u') {
                                uffff = 0;
                                for (i = 0; i < 4; i += 1) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === 'string') {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error('Bad string');
            },
            white = function() {
                // Skip whitespace.
                while (ch && ch <= ' ') {
                    next();
                }
            },
            word = function() {
                // true, false, or null.
                switch (ch) {
                    case 't':
                        next('t');
                        next('r');
                        next('u');
                        next('e');
                        return true;
                    case 'f':
                        next('f');
                        next('a');
                        next('l');
                        next('s');
                        next('e');
                        return false;
                    case 'n':
                        next('n');
                        next('u');
                        next('l');
                        next('l');
                        return null;
                }
                error('Unexpected "' + ch + '"');
            },
            value, // Placeholder for the value function.
            array = function() {
                // Parse an array value.
                var array = [];

                if (ch === '[') {
                    next('[');
                    white();
                    if (ch === ']') {
                        next(']');
                        return array; // empty array
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === ']') {
                            next(']');
                            return array;
                        }
                        next(',');
                        white();
                    }
                }
                error('Bad array');
            },
            object = function() {
                // Parse an object value.
                var key,
                    object = {};

                if (ch === '{') {
                    next('{');
                    white();
                    if (ch === '}') {
                        next('}');
                        return object; // empty object
                    }
                    while (ch) {
                        key = string();
                        white();
                        next(':');
                        if (Object.hasOwnProperty.call(object, key)) {
                            error('Duplicate key "' + key + '"');
                        }
                        object[key] = value();
                        white();
                        if (ch === '}') {
                            next('}');
                            return object;
                        }
                        next(',');
                        white();
                    }
                }
                error('Bad object');
            };

        value = function() {
            // Parse a JSON value. It could be an object, an array, a string,
            // a number, or a word.
            white();
            switch (ch) {
                case '{':
                    return object();
                case '[':
                    return array();
                case '"':
                    return string();
                case '-':
                    return number();
                default:
                    return ch >= '0' && ch <= '9' ? number() : word();
            }
        };

        // Return the json_parse function. It will have access to all of the
        // above functions and variables.
        return function(source) {
            var result;

            text = source;
            at = 0;
            ch = ' ';
            result = value();
            white();
            if (ch) {
                error('Syntax error');
            }

            return result;
        };
    })();

    _.base64Encode = function(data) {
        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            enc = '',
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data = _.utf8Encode(data);

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        switch (data.length % 3) {
            case 1:
                enc = enc.slice(0, -2) + '==';
                break;
            case 2:
                enc = enc.slice(0, -1) + '=';
                break;
        }

        return enc;
    };

    _.utf8Encode = function(string) {
        string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        var utftext = '',
            start,
            end;
        var stringl = 0,
            n;

        start = end = 0;
        stringl = string.length;

        for (n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if ((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
            } else {
                enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.substring(start, end);
                }
                utftext += enc;
                start = end = n + 1;
            }
        }

        if (end > start) {
            utftext += string.substring(start, string.length);
        }

        return utftext;
    };

    _.UUID = (function() {

        // Time/ticks information
        // 1*new Date() is a cross browser version of Date.now()
        var T = function() {
            var d = 1 * new Date(),
                i = 0;

            // this while loop figures how many browser ticks go by
            // before 1*new Date() returns a new number, ie the amount
            // of ticks that go by per millisecond
            while (d == 1 * new Date()) {
                i++;
            }

            return d.toString(16) + i.toString(16);
        };

        // Math.Random entropy
        var R = function() {
            return Math.random().toString(16).replace('.', '');
        };

        // User agent entropy
        // This function takes the user agent string, and then xors
        // together each sequence of 8 bytes.  This produces a final
        // sequence of 8 bytes which it returns as hex.
        var UA = function() {
            var ua = userAgent,
                i, ch, buffer = [],
                ret = 0;

            function xor(result, byte_array) {
                var j, tmp = 0;
                for (j = 0; j < byte_array.length; j++) {
                    tmp |= (buffer[j] << j * 8);
                }
                return result ^ tmp;
            }

            for (i = 0; i < ua.length; i++) {
                ch = ua.charCodeAt(i);
                buffer.unshift(ch & 0xFF);
                if (buffer.length >= 4) {
                    ret = xor(ret, buffer);
                    buffer = [];
                }
            }

            if (buffer.length > 0) {
                ret = xor(ret, buffer);
            }

            return ret.toString(16);
        };

        return function() {
            var se = (screen.height * screen.width).toString(16);
            return (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
        };
    })();

    // _.isBlockedUA()
    // This is to block various web spiders from executing our JS and
    // sending false tracking data
    _.isBlockedUA = function(ua) {
        if (/(google web preview|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i.test(ua)) {
            return true;
        }
        return false;
    };

    /**
     * @param {Object=} formdata
     * @param {string=} arg_separator
     */
    _.HTTPBuildQuery = function(formdata, arg_separator) {
        var use_val, use_key, tmp_arr = [];

        if (_.isUndefined(arg_separator)) {
            arg_separator = '&';
        }

        _.each(formdata, function(val, key) {
            use_val = encodeURIComponent(val.toString());
            use_key = encodeURIComponent(key);
            tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
        });

        return tmp_arr.join(arg_separator);
    };

    _.getQueryParam = function(url, param) {
        // Expects a raw URL

        param = param.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        var regexS = '[\\?&]' + param + '=([^&#]*)',
            regex = new RegExp(regexS),
            results = regex.exec(url);
        if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
            return '';
        } else {
            return decodeURIComponent(results[1]).replace(/\+/g, ' ');
        }
    };

    _.getHashParam = function(hash, param) {
        var matches = hash.match(new RegExp(param + '=([^&]*)'));
        return matches ? matches[1] : null;
    };

    // _.cookie
    // Methods partially borrowed from quirksmode.org/js/cookies.html
    _.cookie = {
        get: function(name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
            return null;
        },

        parse: function(name) {
            var cookie;
            try {
                cookie = _.JSONDecode(_.cookie.get(name)) || {};
            } catch (err) {
                // noop
            }
            return cookie;
        },

        set_seconds: function(name, value, seconds, cross_subdomain, is_secure) {
            var cdomain = '',
                expires = '',
                secure = '';

            if (cross_subdomain) {
                var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
                    domain = matches ? matches[0] : '';

                cdomain = ((domain) ? '; domain=.' + domain : '');
            }

            if (seconds) {
                var date = new Date();
                date.setTime(date.getTime() + (seconds * 1000));
                expires = '; expires=' + date.toGMTString();
            }

            if (is_secure) {
                secure = '; secure';
            }

            document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
        },

        set: function(name, value, days, cross_subdomain, is_secure) {
            var cdomain = '', expires = '', secure = '';

            if (cross_subdomain) {
                var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
                    domain = matches ? matches[0] : '';

                cdomain   = ((domain) ? '; domain=.' + domain : '');
            }

            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toGMTString();
            }

            if (is_secure) {
                secure = '; secure';
            }

            var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
            document.cookie = new_cookie_val;
            return new_cookie_val;
        },

        remove: function(name, cross_subdomain) {
            _.cookie.set(name, '', -1, cross_subdomain);
        }
    };

    // _.localStorage
    var _localStorage_supported = null;
    _.localStorage = {
        is_supported: function() {
            if (_localStorage_supported !== null) {
                return _localStorage_supported;
            }

            var supported = true;
            try {
                var key = '__mplssupport__',
                    val = 'xyz';
                _.localStorage.set(key, val);
                if (_.localStorage.get(key) !== val) {
                    supported = false;
                }
                _.localStorage.remove(key);
            } catch (err) {
                supported = false;
            }
            if (!supported) {
                console.error('localStorage unsupported; falling back to cookie store');
            }

            _localStorage_supported = supported;
            return supported;
        },

        error: function(msg) {
            console.error('localStorage error: ' + msg);
        },

        get: function(name) {
            try {
                return window.localStorage.getItem(name);
            } catch (err) {
                _.localStorage.error(err);
            }
            return null;
        },

        parse: function(name) {
            try {
                return _.JSONDecode(_.localStorage.get(name)) || {};
            } catch (err) {
                // noop
            }
            return null;
        },

        set: function(name, value) {
            try {
                window.localStorage.setItem(name, value);
            } catch (err) {
                _.localStorage.error(err);
            }
        },

        remove: function(name) {
            try {
                window.localStorage.removeItem(name);
            } catch (err) {
                _.localStorage.error(err);
            }
        }
    };

    _.register_event = (function() {
        // written by Dean Edwards, 2005
        // with input from Tino Zijdel - crisp@xs4all.nl
        // with input from Carl Sverre - mail@carlsverre.com
        // with input from Mixpanel
        // http://dean.edwards.name/weblog/2005/10/add-event/
        // https://gist.github.com/1930440

        /**
         * @param {Object} element
         * @param {string} type
         * @param {function(...[*])} handler
         * @param {boolean=} oldSchool
         * @param {boolean=} useCapture
         */
        var register_event = function(element, type, handler, oldSchool, useCapture) {
            if (!element) {
                console.error('No valid element provided to register_event');
                return;
            }

            if (element.addEventListener && !oldSchool) {
                element.addEventListener(type, handler, !!useCapture);
            } else {
                var ontype = 'on' + type;
                var old_handler = element[ontype]; // can be undefined
                element[ontype] = makeHandler(element, handler, old_handler);
            }
        };

        function makeHandler(element, new_handler, old_handlers) {
            var handler = function(event) {
                event = event || fixEvent(window.event);

                // this basically happens in firefox whenever another script
                // overwrites the onload callback and doesn't pass the event
                // object to previously defined callbacks.  All the browsers
                // that don't define window.event implement addEventListener
                // so the dom_loaded handler will still be fired as usual.
                if (!event) {
                    return undefined;
                }

                var ret = true;
                var old_result, new_result;

                if (_.isFunction(old_handlers)) {
                    old_result = old_handlers(event);
                }
                new_result = new_handler.call(element, event);

                if ((false === old_result) || (false === new_result)) {
                    ret = false;
                }

                return ret;
            };

            return handler;
        }

        function fixEvent(event) {
            if (event) {
                event.preventDefault = fixEvent.preventDefault;
                event.stopPropagation = fixEvent.stopPropagation;
            }
            return event;
        }
        fixEvent.preventDefault = function() {
            this.returnValue = false;
        };
        fixEvent.stopPropagation = function() {
            this.cancelBubble = true;
        };

        return register_event;
    })();

    _.dom_query = (function() {
        /* document.getElementsBySelector(selector)
        - returns an array of element objects from the current document
        matching the CSS selector. Selectors can contain element names,
        class names and ids and can be nested. For example:

        elements = document.getElementsBySelector('div#main p a.external')

        Will return an array of all 'a' elements with 'external' in their
        class attribute that are contained inside 'p' elements that are
        contained inside the 'div' element which has id="main"

        New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
        See http://www.w3.org/TR/css3-selectors/#attribute-selectors

        Version 0.4 - Simon Willison, March 25th 2003
        -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
        -- Opera 7 fails

        Version 0.5 - Carl Sverre, Jan 7th 2013
        -- Now uses jQuery-esque `hasClass` for testing class name
        equality.  This fixes a bug related to '-' characters being
        considered not part of a 'word' in regex.
        */

        function getAllChildren(e) {
            // Returns all children of element. Workaround required for IE5/Windows. Ugh.
            return e.all ? e.all : e.getElementsByTagName('*');
        }

        var bad_whitespace = /[\t\r\n]/g;

        function hasClass(elem, selector) {
            var className = ' ' + selector + ' ';
            return ((' ' + elem.className + ' ').replace(bad_whitespace, ' ').indexOf(className) >= 0);
        }

        function getElementsBySelector(selector) {
            // Attempt to fail gracefully in lesser browsers
            if (!document.getElementsByTagName) {
                return [];
            }
            // Split selector in to tokens
            var tokens = selector.split(' ');
            var token, bits, tagName, found, foundCount, i, j, k, elements, currentContextIndex;
            var currentContext = [document];
            for (i = 0; i < tokens.length; i++) {
                token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
                if (token.indexOf('#') > -1) {
                    // Token is an ID selector
                    bits = token.split('#');
                    tagName = bits[0];
                    var id = bits[1];
                    var element = document.getElementById(id);
                    if (!element || (tagName && element.nodeName.toLowerCase() != tagName)) {
                        // element not found or tag with that ID not found, return false
                        return [];
                    }
                    // Set currentContext to contain just this element
                    currentContext = [element];
                    continue; // Skip to next token
                }
                if (token.indexOf('.') > -1) {
                    // Token contains a class selector
                    bits = token.split('.');
                    tagName = bits[0];
                    var className = bits[1];
                    if (!tagName) {
                        tagName = '*';
                    }
                    // Get elements matching tag, filter them for class selector
                    found = [];
                    foundCount = 0;
                    for (j = 0; j < currentContext.length; j++) {
                        if (tagName == '*') {
                            elements = getAllChildren(currentContext[j]);
                        } else {
                            elements = currentContext[j].getElementsByTagName(tagName);
                        }
                        for (k = 0; k < elements.length; k++) {
                            found[foundCount++] = elements[k];
                        }
                    }
                    currentContext = [];
                    currentContextIndex = 0;
                    for (j = 0; j < found.length; j++) {
                        if (found[j].className &&
                            _.isString(found[j].className) && // some SVG elements have classNames which are not strings
                            hasClass(found[j], className)
                        ) {
                            currentContext[currentContextIndex++] = found[j];
                        }
                    }
                    continue; // Skip to next token
                }
                // Code to deal with attribute selectors
                var token_match = token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/);
                if (token_match) {
                    tagName = token_match[1];
                    var attrName = token_match[2];
                    var attrOperator = token_match[3];
                    var attrValue = token_match[4];
                    if (!tagName) {
                        tagName = '*';
                    }
                    // Grab all of the tagName elements within current context
                    found = [];
                    foundCount = 0;
                    for (j = 0; j < currentContext.length; j++) {
                        if (tagName == '*') {
                            elements = getAllChildren(currentContext[j]);
                        } else {
                            elements = currentContext[j].getElementsByTagName(tagName);
                        }
                        for (k = 0; k < elements.length; k++) {
                            found[foundCount++] = elements[k];
                        }
                    }
                    currentContext = [];
                    currentContextIndex = 0;
                    var checkFunction; // This function will be used to filter the elements
                    switch (attrOperator) {
                        case '=': // Equality
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName) == attrValue);
                            };
                            break;
                        case '~': // Match one of space seperated words
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName).match(new RegExp('\\b' + attrValue + '\\b')));
                            };
                            break;
                        case '|': // Match start with value followed by optional hyphen
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?')));
                            };
                            break;
                        case '^': // Match starts with value
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName).indexOf(attrValue) === 0);
                            };
                            break;
                        case '$': // Match ends with value - fails with "Warning" in Opera 7
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length);
                            };
                            break;
                        case '*': // Match ends with value
                            checkFunction = function(e) {
                                return (e.getAttribute(attrName).indexOf(attrValue) > -1);
                            };
                            break;
                        default:
                            // Just test for existence of attribute
                            checkFunction = function(e) {
                                return e.getAttribute(attrName);
                            };
                    }
                    currentContext = [];
                    currentContextIndex = 0;
                    for (j = 0; j < found.length; j++) {
                        if (checkFunction(found[j])) {
                            currentContext[currentContextIndex++] = found[j];
                        }
                    }
                    // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
                    continue; // Skip to next token
                }
                // If we get here, token is JUST an element (not a class or ID selector)
                tagName = token;
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    elements = currentContext[j].getElementsByTagName(tagName);
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = found;
            }
            return currentContext;
        }

        return function(query) {
            if (_.isElement(query)) {
                return [query];
            } else if (_.isObject(query) && !_.isUndefined(query.length)) {
                return query;
            } else {
                return getElementsBySelector.call(this, query);
            }
        };
    })();

    _.info = {
        campaignParams: function() {
            var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
                kw = '',
                params = {};
            _.each(campaign_keywords, function(kwkey) {
                kw = _.getQueryParam(document.URL, kwkey);
                if (kw.length) {
                    params[kwkey] = kw;
                }
            });

            return params;
        },

        searchEngine: function(referrer) {
            if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
                return 'google';
            } else if (referrer.search('https?://(.*)bing.com') === 0) {
                return 'bing';
            } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
                return 'yahoo';
            } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
                return 'duckduckgo';
            } else {
                return null;
            }
        },

        searchInfo: function(referrer) {
            var search = _.info.searchEngine(referrer),
                param = (search != 'yahoo') ? 'q' : 'p',
                ret = {};

            if (search !== null) {
                ret['$search_engine'] = search;

                var keyword = _.getQueryParam(referrer, param);
                if (keyword.length) {
                    ret['mp_keyword'] = keyword;
                }
            }

            return ret;
        },

        /**
         * This function detects which browser is running this script.
         * The order of the checks are important since many user agents
         * include key words used in later checks.
         */
        browser: function(user_agent, vendor, opera) {
            vendor = vendor || ''; // vendor is undefined for at least IE9
            if (opera || _.includes(user_agent, ' OPR/')) {
                if (_.includes(user_agent, 'Mini')) {
                    return 'Opera Mini';
                }
                return 'Opera';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (_.includes(user_agent, 'IEMobile') || _.includes(user_agent, 'WPDesktop')) {
                return 'Internet Explorer Mobile';
            } else if (_.includes(user_agent, 'Edge')) {
                return 'Microsoft Edge';
            } else if (_.includes(user_agent, 'FBIOS')) {
                return 'Facebook Mobile';
            } else if (_.includes(user_agent, 'Chrome')) {
                return 'Chrome';
            } else if (_.includes(user_agent, 'CriOS')) {
                return 'Chrome iOS';
            } else if (_.includes(user_agent, 'UCWEB') || _.includes(user_agent, 'UCBrowser')) {
                return 'UC Browser';
            } else if (_.includes(user_agent, 'FxiOS')) {
                return 'Firefox iOS';
            } else if (_.includes(vendor, 'Apple')) {
                if (_.includes(user_agent, 'Mobile')) {
                    return 'Mobile Safari';
                }
                return 'Safari';
            } else if (_.includes(user_agent, 'Android')) {
                return 'Android Mobile';
            } else if (_.includes(user_agent, 'Konqueror')) {
                return 'Konqueror';
            } else if (_.includes(user_agent, 'Firefox')) {
                return 'Firefox';
            } else if (_.includes(user_agent, 'MSIE') || _.includes(user_agent, 'Trident/')) {
                return 'Internet Explorer';
            } else if (_.includes(user_agent, 'Gecko')) {
                return 'Mozilla';
            } else {
                return '';
            }
        },

        /**
         * This function detects which browser version is running this script,
         * parsing major and minor version (e.g., 42.1). User agent strings from:
         * http://www.useragentstring.com/pages/useragentstring.php
         */
        browserVersion: function(userAgent, vendor, opera) {
            var browser = _.info.browser(userAgent, vendor, opera);
            var versionRegexs = {
                'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
                'Microsoft Edge': /Edge\/(\d+(\.\d+)?)/,
                'Chrome': /Chrome\/(\d+(\.\d+)?)/,
                'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
                'UC Browser' : /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
                'Safari': /Version\/(\d+(\.\d+)?)/,
                'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
                'Opera': /(Opera|OPR)\/(\d+(\.\d+)?)/,
                'Firefox': /Firefox\/(\d+(\.\d+)?)/,
                'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
                'Konqueror': /Konqueror:(\d+(\.\d+)?)/,
                'BlackBerry': /BlackBerry (\d+(\.\d+)?)/,
                'Android Mobile': /android\s(\d+(\.\d+)?)/,
                'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
                'Mozilla': /rv:(\d+(\.\d+)?)/
            };
            var regex = versionRegexs[browser];
            if (regex === undefined) {
                return null;
            }
            var matches = userAgent.match(regex);
            if (!matches) {
                return null;
            }
            return parseFloat(matches[matches.length - 2]);
        },

        os: function() {
            var a = userAgent;
            if (/Windows/i.test(a)) {
                if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                    return 'Windows Phone';
                }
                return 'Windows';
            } else if (/(iPhone|iPad|iPod)/.test(a)) {
                return 'iOS';
            } else if (/Android/.test(a)) {
                return 'Android';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
                return 'BlackBerry';
            } else if (/Mac/i.test(a)) {
                return 'Mac OS X';
            } else if (/Linux/.test(a)) {
                return 'Linux';
            } else if (/CrOS/.test(a)) {
                return 'Chrome OS';
            } else {
                return '';
            }
        },

        device: function(user_agent) {
            if (/Windows Phone/i.test(user_agent) || /WPDesktop/.test(user_agent)) {
                return 'Windows Phone';
            } else if (/iPad/.test(user_agent)) {
                return 'iPad';
            } else if (/iPod/.test(user_agent)) {
                return 'iPod Touch';
            } else if (/iPhone/.test(user_agent)) {
                return 'iPhone';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (/Android/.test(user_agent)) {
                return 'Android';
            } else {
                return '';
            }
        },

        referringDomain: function(referrer) {
            var split = referrer.split('/');
            if (split.length >= 3) {
                return split[2];
            }
            return '';
        },

        properties: function() {
            return _.extend(_.strip_empty_properties({
                '$os': _.info.os(),
                '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
                '$referrer': document.referrer,
                '$referring_domain': _.info.referringDomain(document.referrer),
                '$device': _.info.device(userAgent)
            }), {
                '$current_url': win.location.href,
                '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera),
                '$screen_height': screen.height,
                '$screen_width': screen.width,
                'mp_lib': 'web',
                '$lib_version': Config.LIB_VERSION
            });
        },

        people_properties: function() {
            return _.extend(_.strip_empty_properties({
                '$os': _.info.os(),
                '$browser': _.info.browser(userAgent, navigator.vendor, windowOpera)
            }), {
                '$browser_version': _.info.browserVersion(userAgent, navigator.vendor, windowOpera)
            });
        },

        pageviewInfo: function(page) {
            return _.strip_empty_properties({
                'mp_page': page,
                'mp_referrer': document.referrer,
                'mp_browser': _.info.browser(userAgent, navigator.vendor, windowOpera),
                'mp_platform': _.info.os()
            });
        }
    };

    // EXPORTS (for closure compiler)
    _['toArray']            = _.toArray;
    _['isObject']           = _.isObject;
    _['JSONEncode']         = _.JSONEncode;
    _['JSONDecode']         = _.JSONDecode;
    _['isBlockedUA']        = _.isBlockedUA;
    _['isEmptyObject']      = _.isEmptyObject;
    _['info']               = _.info;
    _['info']['device']     = _.info.device;
    _['info']['browser']    = _.info.browser;
    _['info']['properties'] = _.info.properties;

    // ==ClosureCompiler==
    // @compilation_level ADVANCED_OPTIMIZATIONS
    // @output_file_name mixpanel-2.8.min.js
    // ==/ClosureCompiler==

    /*
    SIMPLE STYLE GUIDE:

    this.x === public function
    this._x === internal - only use within this file
    this.__x === private - only use within the class

    Globals should be all caps
    */

    var init_type;       // MODULE or SNIPPET loader
    var mixpanel_master; // main mixpanel instance / object
    var INIT_MODULE  = 0;
    var INIT_SNIPPET = 1;

    /*
     * Constants
     */
    /** @const */   var PRIMARY_INSTANCE_NAME     = 'mixpanel';
    /** @const */   var SET_QUEUE_KEY             = '__mps';
    /** @const */   var SET_ONCE_QUEUE_KEY        = '__mpso';
    /** @const */   var UNSET_QUEUE_KEY           = '__mpus';
    /** @const */   var ADD_QUEUE_KEY             = '__mpa';
    /** @const */   var APPEND_QUEUE_KEY          = '__mpap';
    /** @const */   var UNION_QUEUE_KEY           = '__mpu';
    /** @const */   var SET_ACTION                = '$set';
    /** @const */   var SET_ONCE_ACTION           = '$set_once';
    /** @const */   var UNSET_ACTION              = '$unset';
    /** @const */   var ADD_ACTION                = '$add';
    /** @const */   var APPEND_ACTION             = '$append';
    /** @const */   var UNION_ACTION              = '$union';
    // This key is deprecated, but we want to check for it to see whether aliasing is allowed.
    /** @const */   var PEOPLE_DISTINCT_ID_KEY    = '$people_distinct_id';
    /** @const */   var ALIAS_ID_KEY              = '__alias';
    /** @const */   var CAMPAIGN_IDS_KEY          = '__cmpns';
    /** @const */   var EVENT_TIMERS_KEY          = '__timers';
    /** @const */   var RESERVED_PROPERTIES       = [
        SET_QUEUE_KEY,
        SET_ONCE_QUEUE_KEY,
        UNSET_QUEUE_KEY,
        ADD_QUEUE_KEY,
        APPEND_QUEUE_KEY,
        UNION_QUEUE_KEY,
        PEOPLE_DISTINCT_ID_KEY,
        ALIAS_ID_KEY,
        CAMPAIGN_IDS_KEY,
        EVENT_TIMERS_KEY
    ];

    /*
     * Dynamic... constants? Is that an oxymoron?
     */
        // http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
        // https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#withCredentials
    var USE_XHR = (win.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());

        // IE<10 does not support cross-origin XHR's but script tags
        // with defer won't block window.onload; ENQUEUE_REQUESTS
        // should only be true for Opera<12
    var ENQUEUE_REQUESTS = !USE_XHR && (userAgent.indexOf('MSIE') === -1) && (userAgent.indexOf('Mozilla') === -1);

    /*
     * Module-level globals
     */
    var DEFAULT_CONFIG = {
        'api_host':                          'https://api.mixpanel.com',
        'app_host':                          'https://mixpanel.com',
        'autotrack':                         true,
        'cdn':                               'https://cdn.mxpnl.com',
        'cross_subdomain_cookie':            true,
        'persistence':                       'cookie',
        'persistence_name':                  '',
        'cookie_name':                       '',
        'loaded':                            function() {},
        'store_google':                      true,
        'save_referrer':                     true,
        'test':                              false,
        'verbose':                           false,
        'img':                               false,
        'track_pageview':                    true,
        'debug':                             false,
        'track_links_timeout':               300,
        'cookie_expiration':                 365,
        'upgrade':                           false,
        'disable_persistence':               false,
        'disable_cookie':                    false,
        'secure_cookie':                     false,
        'ip':                                true,
        'property_blacklist':                [],
        'xhr_headers':                       {} // { header: value, header2: value }
    };

    var DOM_LOADED = false;

    /**
     * Mixpanel Persistence Object
     * @constructor
     */
    var MixpanelPersistence = function(config) {
        this['props'] = {};
        this.campaign_params_saved = false;

        if (config['persistence_name']) {
            this.name = 'mp_' + config['persistence_name'];
        } else {
            this.name = 'mp_' + config['token'] + '_mixpanel';
        }

        var storage_type = config['persistence'];
        if (storage_type !== 'cookie' && storage_type !== 'localStorage') {
            console.critical('Unknown persistence type ' + storage_type + '; falling back to cookie');
            storage_type = config['persistence'] = 'cookie';
        }

        if (storage_type === 'localStorage' && _.localStorage.is_supported()) {
            this.storage = _.localStorage;
        } else {
            this.storage = _.cookie;
        }

        this.load();
        this.update_config(config);
        this.upgrade(config);
        this.save();
    };

    MixpanelPersistence.prototype.properties = function() {
        var p = {};
        // Filter out reserved properties
        _.each(this['props'], function(v, k) {
            if (!_.include(RESERVED_PROPERTIES, k)) {
                p[k] = v;
            }
        });
        return p;
    };

    MixpanelPersistence.prototype.load = function() {
        if (this.disabled) { return; }

        var entry = this.storage.parse(this.name);

        if (entry) {
            this['props'] = _.extend({}, entry);
        }
    };

    MixpanelPersistence.prototype.upgrade = function(config) {
        var upgrade_from_old_lib = config['upgrade'],
            old_cookie_name,
            old_cookie;

        if (upgrade_from_old_lib) {
            old_cookie_name = 'mp_super_properties';
            // Case where they had a custom cookie name before.
            if (typeof(upgrade_from_old_lib) === 'string') {
                old_cookie_name = upgrade_from_old_lib;
            }

            old_cookie = this.storage.parse(old_cookie_name);

            // remove the cookie
            this.storage.remove(old_cookie_name);
            this.storage.remove(old_cookie_name, true);

            if (old_cookie) {
                this['props'] = _.extend(
                    this['props'],
                    old_cookie['all'],
                    old_cookie['events']
                );
            }
        }

        if (!config['cookie_name'] && config['name'] !== 'mixpanel') {
            // special case to handle people with cookies of the form
            // mp_TOKEN_INSTANCENAME from the first release of this library
            old_cookie_name = 'mp_' + config['token'] + '_' + config['name'];
            old_cookie = this.storage.parse(old_cookie_name);

            if (old_cookie) {
                this.storage.remove(old_cookie_name);
                this.storage.remove(old_cookie_name, true);

                // Save the prop values that were in the cookie from before -
                // this should only happen once as we delete the old one.
                this.register_once(old_cookie);
            }
        }

        if (this.storage === _.localStorage) {
            old_cookie = _.cookie.parse(this.name);

            _.cookie.remove(this.name);
            _.cookie.remove(this.name, true);

            if (old_cookie) {
                this.register_once(old_cookie);
            }
        }
    };

    MixpanelPersistence.prototype.save = function() {
        if (this.disabled) { return; }
        this._expire_notification_campaigns();
        this.storage.set(
            this.name,
            _.JSONEncode(this['props']),
            this.expire_days,
            this.cross_subdomain,
            this.secure
        );
    };

    MixpanelPersistence.prototype.remove = function() {
        // remove both domain and subdomain cookies
        this.storage.remove(this.name, false);
        this.storage.remove(this.name, true);
    };

    // removes the storage entry and deletes all loaded data
    // forced name for tests
    MixpanelPersistence.prototype.clear = function() {
        this.remove();
        this['props'] = {};
    };

    /**
     * @param {Object} props
     * @param {*=} default_value
     * @param {number=} days
     */
    MixpanelPersistence.prototype.register_once = function(props, default_value, days) {
        if (_.isObject(props)) {
            if (typeof(default_value) === 'undefined') { default_value = 'None'; }
            this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

            _.each(props, function(val, prop) {
                if (!this['props'].hasOwnProperty(prop) || this['props'][prop] === default_value) {
                    this['props'][prop] = val;
                }
            }, this);

            this.save();

            return true;
        }
        return false;
    };

    /**
     * @param {Object} props
     * @param {number=} days
     */
    MixpanelPersistence.prototype.register = function(props, days) {
        if (_.isObject(props)) {
            this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

            _.extend(this['props'], props);

            this.save();

            return true;
        }
        return false;
    };

    MixpanelPersistence.prototype.unregister = function(prop) {
        if (prop in this['props']) {
            delete this['props'][prop];
            this.save();
        }
    };

    MixpanelPersistence.prototype._expire_notification_campaigns = _.safewrap(function() {
        var campaigns_shown = this['props'][CAMPAIGN_IDS_KEY],
            EXPIRY_TIME = Config.DEBUG ? 60 * 1000 : 60 * 60 * 1000; // 1 minute (Config.DEBUG) / 1 hour (PDXN)
        if (!campaigns_shown) {
            return;
        }
        for (var campaign_id in campaigns_shown) {
            if (1 * new Date() - campaigns_shown[campaign_id] > EXPIRY_TIME) {
                delete campaigns_shown[campaign_id];
            }
        }
        if (_.isEmptyObject(campaigns_shown)) {
            delete this['props'][CAMPAIGN_IDS_KEY];
        }
    });

    MixpanelPersistence.prototype.update_campaign_params = function() {
        if (!this.campaign_params_saved) {
            this.register_once(_.info.campaignParams());
            this.campaign_params_saved = true;
        }
    };

    MixpanelPersistence.prototype.update_search_keyword = function(referrer) {
        this.register(_.info.searchInfo(referrer));
    };

    // EXPORTED METHOD, we test this directly.
    MixpanelPersistence.prototype.update_referrer_info = function(referrer) {
        // If referrer doesn't exist, we want to note the fact that it was type-in traffic.
        this.register_once({
            '$initial_referrer': referrer || '$direct',
            '$initial_referring_domain': _.info.referringDomain(referrer) || '$direct'
        }, '');
    };

    MixpanelPersistence.prototype.get_referrer_info = function() {
        return _.strip_empty_properties({
            '$initial_referrer': this['props']['$initial_referrer'],
            '$initial_referring_domain': this['props']['$initial_referring_domain']
        });
    };

    // safely fills the passed in object with stored properties,
    // does not override any properties defined in both
    // returns the passed in object
    MixpanelPersistence.prototype.safe_merge = function(props) {
        _.each(this['props'], function(val, prop) {
            if (!(prop in props)) {
                props[prop] = val;
            }
        });

        return props;
    };

    MixpanelPersistence.prototype.update_config = function(config) {
        this.default_expiry = this.expire_days = config['cookie_expiration'];
        this.set_disabled(config['disable_persistence']);
        this.set_cross_subdomain(config['cross_subdomain_cookie']);
        this.set_secure(config['secure_cookie']);
    };

    MixpanelPersistence.prototype.set_disabled = function(disabled) {
        this.disabled = disabled;
        if (this.disabled) {
            this.remove();
        } else {
            this.save();
        }
    };

    MixpanelPersistence.prototype.set_cross_subdomain = function(cross_subdomain) {
        if (cross_subdomain !== this.cross_subdomain) {
            this.cross_subdomain = cross_subdomain;
            this.remove();
            this.save();
        }
    };

    MixpanelPersistence.prototype.get_cross_subdomain = function() {
        return this.cross_subdomain;
    };

    MixpanelPersistence.prototype.set_secure = function(secure) {
        if (secure !== this.secure) {
            this.secure = secure ? true : false;
            this.remove();
            this.save();
        }
    };

    MixpanelPersistence.prototype._add_to_people_queue = function(queue, data) {
        var q_key = this._get_queue_key(queue),
            q_data = data[queue],
            set_q = this._get_or_create_queue(SET_ACTION),
            set_once_q = this._get_or_create_queue(SET_ONCE_ACTION),
            unset_q = this._get_or_create_queue(UNSET_ACTION),
            add_q = this._get_or_create_queue(ADD_ACTION),
            union_q = this._get_or_create_queue(UNION_ACTION),
            append_q = this._get_or_create_queue(APPEND_ACTION, []);

        if (q_key === SET_QUEUE_KEY) {
            // Update the set queue - we can override any existing values
            _.extend(set_q, q_data);
            // if there was a pending increment, override it
            // with the set.
            this._pop_from_people_queue(ADD_ACTION, q_data);
            // if there was a pending union, override it
            // with the set.
            this._pop_from_people_queue(UNION_ACTION, q_data);
            this._pop_from_people_queue(UNSET_ACTION, q_data);
        } else if (q_key === SET_ONCE_QUEUE_KEY) {
            // only queue the data if there is not already a set_once call for it.
            _.each(q_data, function(v, k) {
                if (!(k in set_once_q)) {
                    set_once_q[k] = v;
                }
            });
            this._pop_from_people_queue(UNSET_ACTION, q_data);
        } else if (q_key === UNSET_QUEUE_KEY) {
            _.each(q_data, function(prop) {

                // undo previously-queued actions on this key
                _.each([set_q, set_once_q, add_q, union_q], function(enqueued_obj) {
                    if (prop in enqueued_obj) {
                        delete enqueued_obj[prop];
                    }
                });
                _.each(append_q, function(append_obj) {
                    if (prop in append_obj) {
                        delete append_obj[prop];
                    }
                });

                unset_q[prop] = true;

            });
        } else if (q_key === ADD_QUEUE_KEY) {
            _.each(q_data, function(v, k) {
                // If it exists in the set queue, increment
                // the value
                if (k in set_q) {
                    set_q[k] += v;
                } else {
                    // If it doesn't exist, update the add
                    // queue
                    if (!(k in add_q)) {
                        add_q[k] = 0;
                    }
                    add_q[k] += v;
                }
            }, this);
            this._pop_from_people_queue(UNSET_ACTION, q_data);
        } else if (q_key === UNION_QUEUE_KEY) {
            _.each(q_data, function(v, k) {
                if (_.isArray(v)) {
                    if (!(k in union_q)) {
                        union_q[k] = [];
                    }
                    // We may send duplicates, the server will dedup them.
                    union_q[k] = union_q[k].concat(v);
                }
            });
            this._pop_from_people_queue(UNSET_ACTION, q_data);
        } else if (q_key === APPEND_QUEUE_KEY) {
            append_q.push(q_data);
            this._pop_from_people_queue(UNSET_ACTION, q_data);
        }

        console.log('MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):');
        console.log(data);

        this.save();
    };

    MixpanelPersistence.prototype._pop_from_people_queue = function(queue, data) {
        var q = this._get_queue(queue);
        if (!_.isUndefined(q)) {
            _.each(data, function(v, k) {
                delete q[k];
            }, this);

            this.save();
        }
    };

    MixpanelPersistence.prototype._get_queue_key = function(queue) {
        if (queue === SET_ACTION) {
            return SET_QUEUE_KEY;
        } else if (queue === SET_ONCE_ACTION) {
            return SET_ONCE_QUEUE_KEY;
        } else if (queue === UNSET_ACTION) {
            return UNSET_QUEUE_KEY;
        } else if (queue === ADD_ACTION) {
            return ADD_QUEUE_KEY;
        } else if (queue === APPEND_ACTION) {
            return APPEND_QUEUE_KEY;
        } else if (queue === UNION_ACTION) {
            return UNION_QUEUE_KEY;
        } else {
            console.error('Invalid queue:', queue);
        }
    };

    MixpanelPersistence.prototype._get_queue = function(queue) {
        return this['props'][this._get_queue_key(queue)];
    };
    MixpanelPersistence.prototype._get_or_create_queue = function(queue, default_val) {
        var key = this._get_queue_key(queue);
        default_val = _.isUndefined(default_val) ? {} : default_val;

        return this['props'][key] || (this['props'][key] = default_val);
    };

    MixpanelPersistence.prototype.set_event_timer = function(event_name, timestamp) {
        var timers = this['props'][EVENT_TIMERS_KEY] || {};
        timers[event_name] = timestamp;
        this['props'][EVENT_TIMERS_KEY] = timers;
        this.save();
    };

    MixpanelPersistence.prototype.remove_event_timer = function(event_name) {
        var timers = this['props'][EVENT_TIMERS_KEY] || {};
        var timestamp = timers[event_name];
        if (!_.isUndefined(timestamp)) {
            delete this['props'][EVENT_TIMERS_KEY][event_name];
            this.save();
        }
        return timestamp;
    };

    /**
     * Mixpanel Library Object
     * @constructor
     */
    var MixpanelLib = function() {};

    /**
     * Mixpanel People Object
     * @constructor
     */
    var MixpanelPeople = function() {};

    /**
     * create_mplib(token:string, config:object, name:string)
     *
     * This function is used by the init method of MixpanelLib objects
     * as well as the main initializer at the end of the JSLib (that
     * initializes document.mixpanel as well as any additional instances
     * declared before this file has loaded).
     */
    var create_mplib = function(token, config, name) {
        var instance,
            target = (name === PRIMARY_INSTANCE_NAME) ? mixpanel_master : mixpanel_master[name];

        if (target && init_type === INIT_MODULE) {
            instance = target;
        } else {
            if (target && !_.isArray(target)) {
                console.error('You have already initialized ' + name);
                return;
            }
            instance = new MixpanelLib();
        }

        instance._init(token, config, name);

        instance['people'] = new MixpanelPeople();
        instance['people']._init(instance);

        // if any instance on the page has debug = true, we set the
        // global debug to be true
        Config.DEBUG = Config.DEBUG || instance.get_config('debug');

        // if target is not defined, we called init after the lib already
        // loaded, so there won't be an array of things to execute
        if (!_.isUndefined(target) && _.isArray(target)) {
            // Crunch through the people queue first - we queue this data up &
            // flush on identify, so it's better to do all these operations first
            instance._execute_array.call(instance['people'], target['people']);
            instance._execute_array(target);
        }

        return instance;
    };

    // Initialization methods

    /**
     * This function initializes a new instance of the Mixpanel tracking object.
     * All new instances are added to the main mixpanel object as sub properties (such as
     * mixpanel.library_name) and also returned by this function. To define a
     * second instance on the page, you would call:
     *
     *     mixpanel.init('new token', { your: 'config' }, 'library_name');
     *
     * and use it like so:
     *
     *     mixpanel.library_name.track(...);
     *
     * @param {String} token   Your Mixpanel API token
     * @param {Object} [config]  A dictionary of config options to override. <a href="https://github.com/mixpanel/mixpanel-js/blob/8b2e1f7b/src/mixpanel-core.js#L87-L110">See a list of default config options</a>.
     * @param {String} [name]    The name for the new mixpanel instance that you want created
     */
    MixpanelLib.prototype.init = function (token, config, name) {
        if (_.isUndefined(name)) {
            console.error('You must name your new library: init(token, config, name)');
            return;
        }
        if (name === PRIMARY_INSTANCE_NAME) {
            console.error('You must initialize the main mixpanel object right after you include the Mixpanel js snippet');
            return;
        }

        var instance = create_mplib(token, config, name);
        mixpanel_master[name] = instance;
        instance._loaded();

        return instance;
    };

    // mixpanel._init(token:string, config:object, name:string)
    //
    // This function sets up the current instance of the mixpanel
    // library.  The difference between this method and the init(...)
    // method is this one initializes the actual instance, whereas the
    // init(...) method sets up a new library and calls _init on it.
    //
    MixpanelLib.prototype._init = function(token, config, name) {
        this['__loaded'] = true;
        this['config'] = {};

        this.set_config(_.extend({}, DEFAULT_CONFIG, config, {
            'name': name,
            'token': token,
            'callback_fn': ((name === PRIMARY_INSTANCE_NAME) ? name : PRIMARY_INSTANCE_NAME + '.' + name) + '._jsc'
        }));

        this['_jsc'] = function() {};

        this.__dom_loaded_queue = [];
        this.__request_queue = [];
        this.__disabled_events = [];
        this._flags = {
            'disable_all_events': false,
            'identify_called': false
        };

        this['persistence'] = this['cookie'] = new MixpanelPersistence(this['config']);
        this._init_gdpr_persistence();

        this.register_once({'distinct_id': _.UUID()}, '');
    };

    // Private methods

    MixpanelLib.prototype._loaded = function() {
        this.get_config('loaded')(this);

        // this happens after so a user can call identify/name_tag in
        // the loaded callback
        if (this.get_config('track_pageview')) {
            this.track_pageview();
        }
    };

    MixpanelLib.prototype._dom_loaded = function() {
        _.each(this.__dom_loaded_queue, function(item) {
            this._track_dom.apply(this, item);
        }, this);

        if (!this.has_opted_out_tracking()) {
            _.each(this.__request_queue, function(item) {
                this._send_request.apply(this, item);
            }, this);
        }

        delete this.__dom_loaded_queue;
        delete this.__request_queue;
    };

    MixpanelLib.prototype._track_dom = function(DomClass, args) {
        if (this.get_config('img')) {
            console.error('You can\'t use DOM tracking functions with img = true.');
            return false;
        }

        if (!DOM_LOADED) {
            this.__dom_loaded_queue.push([DomClass, args]);
            return false;
        }

        var dt = new DomClass().init(this);
        return dt.track.apply(dt, args);
    };

    /**
     * _prepare_callback() should be called by callers of _send_request for use
     * as the callback argument.
     *
     * If there is no callback, this returns null.
     * If we are going to make XHR/XDR requests, this returns a function.
     * If we are going to use script tags, this returns a string to use as the
     * callback GET param.
     */
    MixpanelLib.prototype._prepare_callback = function(callback, data) {
        if (_.isUndefined(callback)) {
            return null;
        }

        if (USE_XHR) {
            var callback_function = function(response) {
                callback(response, data);
            };
            return callback_function;
        } else {
            // if the user gives us a callback, we store as a random
            // property on this instances jsc function and update our
            // callback string to reflect that.
            var jsc = this['_jsc'];
            var randomized_cb = '' + Math.floor(Math.random() * 100000000);
            var callback_string = this.get_config('callback_fn') + '[' + randomized_cb + ']';
            jsc[randomized_cb] = function(response) {
                delete jsc[randomized_cb];
                callback(response, data);
            };
            return callback_string;
        }
    };

    MixpanelLib.prototype._send_request = function(url, data, callback) {
        if (ENQUEUE_REQUESTS) {
            this.__request_queue.push(arguments);
            return;
        }

        // needed to correctly format responses
        var verbose_mode = this.get_config('verbose');
        if (data['verbose']) { verbose_mode = true; }

        if (this.get_config('test')) { data['test'] = 1; }
        if (verbose_mode) { data['verbose'] = 1; }
        if (this.get_config('img')) { data['img'] = 1; }
        if (!USE_XHR) {
            if (callback) {
                data['callback'] = callback;
            } else if (verbose_mode || this.get_config('test')) {
                // Verbose output (from verbose mode, or an error in test mode) is a json blob,
                // which by itself is not valid javascript. Without a callback, this verbose output will
                // cause an error when returned via jsonp, so we force a no-op callback param.
                // See the ECMA script spec: http://www.ecma-international.org/ecma-262/5.1/#sec-12.4
                data['callback'] = '(function(){})';
            }
        }

        data['ip'] = this.get_config('ip')?1:0;
        data['_'] = new Date().getTime().toString();
        url += '?' + _.HTTPBuildQuery(data);

        if ('img' in data) {
            var img = document.createElement('img');
            img.src = url;
            document.body.appendChild(img);
        } else if (USE_XHR) {
            try {
                var req = new XMLHttpRequest();
                req.open('GET', url, true);

                var headers = this.get_config('xhr_headers');
                _.each(headers, function(headerValue, headerName) {
                    req.setRequestHeader(headerName, headerValue);
                });

                // send the mp_optout cookie
                // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
                req.withCredentials = true;
                req.onreadystatechange = function () {
                    if (req.readyState === 4) { // XMLHttpRequest.DONE == 4, except in safari 4
                        if (req.status === 200) {
                            if (callback) {
                                if (verbose_mode) {
                                    var response;
                                    try {
                                        response = _.JSONDecode(req.responseText);
                                    } catch (e) {
                                        console.error(e);
                                        return;
                                    }
                                    callback(response);
                                } else {
                                    callback(Number(req.responseText));
                                }
                            }
                        } else {
                            var error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                            console.error(error);
                            if (callback) {
                                if (verbose_mode) {
                                    callback({status: 0, error: error});
                                } else {
                                    callback(0);
                                }
                            }
                        }
                    }
                };
                req.send(null);
            } catch (e) {
                console.error(e);
            }
        } else {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.defer = true;
            script.src = url;
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(script, s);
        }
    };

    /**
     * _execute_array() deals with processing any mixpanel function
     * calls that were called before the Mixpanel library were loaded
     * (and are thus stored in an array so they can be called later)
     *
     * Note: we fire off all the mixpanel function calls && user defined
     * functions BEFORE we fire off mixpanel tracking calls. This is so
     * identify/register/set_config calls can properly modify early
     * tracking calls.
     *
     * @param {Array} array
     */
    MixpanelLib.prototype._execute_array = function(array) {
        var fn_name, alias_calls = [], other_calls = [], tracking_calls = [];
        _.each(array, function(item) {
            if (item) {
                fn_name = item[0];
                if (typeof(item) === 'function') {
                    item.call(this);
                } else if (_.isArray(item) && fn_name === 'alias') {
                    alias_calls.push(item);
                } else if (_.isArray(item) && fn_name.indexOf('track') !== -1 && typeof(this[fn_name]) === 'function') {
                    tracking_calls.push(item);
                } else {
                    other_calls.push(item);
                }
            }
        }, this);

        var execute = function(calls, context) {
            _.each(calls, function(item) {
                this[item[0]].apply(this, item.slice(1));
            }, context);
        };

        execute(alias_calls, this);
        execute(other_calls, this);
        execute(tracking_calls, this);
    };

    /**
     * Track an event. This is the most important and
     * frequently used Mixpanel function.
     *
     * ### Usage:
     *
     *     // track an event named 'Registered'
     *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
     *
     * To track link clicks or form submissions, see track_links() or track_forms().
     *
     * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
     * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
     * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
     */
    MixpanelLib.prototype.track = function(event_name, properties, callback) {
        if (typeof(callback) !== 'function') {
            callback = function() {};
        }

        if (_.isUndefined(event_name)) {
            console.error('No event name provided to mixpanel.track');
            return;
        }

        if (this._event_is_disabled(event_name)) {
            callback(0);
            return;
        }

        // set defaults
        properties = properties || {};
        properties['token'] = this.get_config('token');

        // set $duration if time_event was previously called for this event
        var start_timestamp = this['persistence'].remove_event_timer(event_name);
        if (!_.isUndefined(start_timestamp)) {
            var duration_in_ms = new Date().getTime() - start_timestamp;
            properties['$duration'] = parseFloat((duration_in_ms / 1000).toFixed(3));
        }

        // update persistence
        this['persistence'].update_search_keyword(document.referrer);

        if (this.get_config('store_google')) { this['persistence'].update_campaign_params(); }
        if (this.get_config('save_referrer')) { this['persistence'].update_referrer_info(document.referrer); }

        // note: extend writes to the first object, so lets make sure we
        // don't write to the persistence properties object and info
        // properties object by passing in a new object

        // update properties with pageview info and super-properties
        properties = _.extend(
            {},
            _.info.properties(),
            this['persistence'].properties(),
            properties
        );

        var property_blacklist = this.get_config('property_blacklist');
        if (_.isArray(property_blacklist)) {
            _.each(property_blacklist, function(blacklisted_prop) {
                delete properties[blacklisted_prop];
            });
        } else {
            console.error('Invalid value for property_blacklist config: ' + property_blacklist);
        }

        var data = {
            'event': event_name,
            'properties': properties
        };

        var truncated_data = _.truncate(data, 255);
        var json_data      = _.JSONEncode(truncated_data);
        var encoded_data   = _.base64Encode(json_data);

        console.log('MIXPANEL REQUEST:');
        console.log(truncated_data);

        this._send_request(
            this.get_config('api_host') + '/track/',
            { 'data': encoded_data },
            this._prepare_callback(callback, truncated_data)
        );

        return truncated_data;
    };

    /**
     * Register a set of super properties, which are included with all
     * events. This will overwrite previous super property values.
     *
     * ### Usage:
     *
     *     // register 'Gender' as a super property
     *     mixpanel.register({'Gender': 'Female'});
     *
     *     // register several super properties when a user signs up
     *     mixpanel.register({
     *         'Email': 'jdoe@example.com',
     *         'Account Type': 'Free'
     *     });
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {Number} [days] How many days since the user's last visit to store the super properties
     */
    MixpanelLib.prototype.register = function(props, days) {
        this['persistence'].register(props, days);
    };

    /**
     * Register a set of super properties only once. This will not
     * overwrite previous super property values, unlike register().
     *
     * ### Usage:
     *
     *     // register a super property for the first time only
     *     mixpanel.register_once({
     *         'First Login Date': new Date().toISOString()
     *     });
     *
     * ### Notes:
     *
     * If default_value is specified, current super properties
     * with that value will be overwritten.
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {*} [default_value] Value to override if already set in super properties (ex: 'False') Default: 'None'
     * @param {Number} [days] How many days since the users last visit to store the super properties
     */
    MixpanelLib.prototype.register_once = function(props, default_value, days) {
        this['persistence'].register_once(props, default_value, days);
    };

    /**
     * Delete a super property stored with the current user.
     *
     * @param {String} property The name of the super property to remove
     */
    MixpanelLib.prototype.unregister = function(property) {
        this['persistence'].unregister(property);
    };

    MixpanelLib.prototype._register_single = function(prop, value) {
        var props = {};
        props[prop] = value;
        this.register(props);
    };

    /**
     * Identify a user with a unique ID instead of a Mixpanel
     * randomly generated distinct_id. If the method is never called,
     * then unique visitors will be identified by a UUID generated
     * the first time they visit the site.
     *
     * ### Notes:
     *
     * You can call this function to overwrite a previously set
     * unique ID for the current user. Mixpanel cannot translate
     * between IDs at this time, so when you change a user's ID
     * they will appear to be a new user.
     *
     * When used alone, mixpanel.identify will change the user's
     * distinct_id to the unique ID provided. When used in tandem
     * with mixpanel.alias, it will allow you to identify based on
     * unique ID and map that back to the original, anonymous
     * distinct_id given to the user upon her first arrival to your
     * site (thus connecting anonymous pre-signup activity to
     * post-signup activity). Though the two work together, do not
     * call identify() at the same time as alias(). Calling the two
     * at the same time can cause a race condition, so it is best
     * practice to call identify on the original, anonymous ID
     * right after you've aliased it.
     * <a href="https://mixpanel.com/help/questions/articles/how-should-i-handle-my-user-identity-with-the-mixpanel-javascript-library">Learn more about how mixpanel.identify and mixpanel.alias can be used</a>.
     *
     * @param {String} [unique_id] A string that uniquely identifies a user. If not provided, the distinct_id currently in the persistent store (cookie or localStorage) will be used.
     */
    MixpanelLib.prototype.identify = function(
        unique_id, _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback
    ) {
        // Optional Parameters
        //  _set_callback:function  A callback to be run if and when the People set queue is flushed
        //  _add_callback:function  A callback to be run if and when the People add queue is flushed
        //  _append_callback:function  A callback to be run if and when the People append queue is flushed
        //  _set_once_callback:function  A callback to be run if and when the People set_once queue is flushed
        //  _union_callback:function  A callback to be run if and when the People union queue is flushed
        //  _unset_callback:function  A callback to be run if and when the People unset queue is flushed

        // identify only changes the distinct id if it doesn't match either the existing or the alias;
        // if it's new, blow away the alias as well.
        if (unique_id !== this.get_distinct_id() && unique_id !== this.get_property(ALIAS_ID_KEY)) {
            this.unregister(ALIAS_ID_KEY);
            this._register_single('distinct_id', unique_id);
        }
        this._check_and_handle_notifications(this.get_distinct_id());
        this._flags.identify_called = true;
        // Flush any queued up people requests
        this['people']._flush(_set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback);
    };

    /**
     * Clears super properties and generates a new random distinct_id for this instance.
     * Useful for clearing data when a user logs out.
     */
    MixpanelLib.prototype.reset = function() {
        this['persistence'].clear();
        this._flags.identify_called = false;
        this.register_once({'distinct_id': _.UUID()}, '');
    };

    /**
     * Returns the current distinct id of the user. This is either the id automatically
     * generated by the library or the id that has been passed by a call to identify().
     *
     * ### Notes:
     *
     * get_distinct_id() can only be called after the Mixpanel library has finished loading.
     * init() has a loaded function available to handle this automatically. For example:
     *
     *     // set distinct_id after the mixpanel library has loaded
     *     mixpanel.init('YOUR PROJECT TOKEN', {
     *         loaded: function(mixpanel) {
     *             distinct_id = mixpanel.get_distinct_id();
     *         }
     *     });
     */
    MixpanelLib.prototype.get_distinct_id = function() {
        return this.get_property('distinct_id');
    };

    /**
     * Create an alias, which Mixpanel will use to link two distinct_ids going forward (not retroactively).
     * Multiple aliases can map to the same original ID, but not vice-versa. Aliases can also be chained - the
     * following is a valid scenario:
     *
     *     mixpanel.alias('new_id', 'existing_id');
     *     ...
     *     mixpanel.alias('newer_id', 'new_id');
     *
     * If the original ID is not passed in, we will use the current distinct_id - probably the auto-generated GUID.
     *
     * ### Notes:
     *
     * The best practice is to call alias() when a unique ID is first created for a user
     * (e.g., when a user first registers for an account and provides an email address).
     * alias() should never be called more than once for a given user, except to
     * chain a newer ID to a previously new ID, as described above.
     *
     * @param {String} alias A unique identifier that you want to use for this user in the future.
     * @param {String} [original] The current identifier being used for this user.
     */
    MixpanelLib.prototype.alias = function(alias, original) {
        // If the $people_distinct_id key exists in persistence, there has been a previous
        // mixpanel.people.identify() call made for this user. It is VERY BAD to make an alias with
        // this ID, as it will duplicate users.
        if (alias === this.get_property(PEOPLE_DISTINCT_ID_KEY)) {
            console.critical('Attempting to create alias for existing People user - aborting.');
            return -2;
        }

        var _this = this;
        if (_.isUndefined(original)) {
            original = this.get_distinct_id();
        }
        if (alias !== original) {
            this._register_single(ALIAS_ID_KEY, alias);
            return this.track('$create_alias', { 'alias': alias, 'distinct_id': original }, function() {
                // Flush the people queue
                _this.identify(alias);
            });
        } else {
            console.error('alias matches current distinct_id - skipping api call.');
            this.identify(alias);
            return -1;
        }
    };

    /**
     * Update the configuration of a mixpanel library instance.
     *
     * The default config is:
     *
     *     {
     *       // super properties cookie expiration (in days)
     *       cookie_expiration: 365
     *
     *       // super properties span subdomains
     *       cross_subdomain_cookie: true
     *
     *       // debug mode
     *       debug: false
     *
     *       // if this is true, the mixpanel cookie or localStorage entry
     *       // will be deleted, and no user persistence will take place
     *       disable_persistence: false
     *
     *       // if this is true, Mixpanel will automatically determine
     *       // City, Region and Country data using the IP address of
     *       //the client
     *       ip: true
     *
     *       // opt users out of tracking by this Mixpanel instance by default
     *       opt_out_tracking_by_default: false
     *
     *       // persistence mechanism used by opt-in/opt-out methods - cookie
     *       // or localStorage - falls back to cookie if localStorage is unavailable
     *       opt_out_tracking_persistence_type: 'localStorage'
     *
     *       // customize the name of cookie/localStorage set by opt-in/opt-out methods
     *       opt_out_tracking_cookie_prefix: null
     *
     *       // type of persistent store for super properties (cookie/
     *       // localStorage) if set to 'localStorage', any existing
     *       // mixpanel cookie value with the same persistence_name
     *       // will be transferred to localStorage and deleted
     *       persistence: 'cookie'
     *
     *       // name for super properties persistent store
     *       persistence_name: ''
     *
     *       // names of properties/superproperties which should never
     *       // be sent with track() calls
     *       property_blacklist: []
     *
     *       // if this is true, mixpanel cookies will be marked as
     *       // secure, meaning they will only be transmitted over https
     *       secure_cookie: false
     *
     *       // the amount of time track_links will
     *       // wait for Mixpanel's servers to respond
     *       track_links_timeout: 300
     *
     *       // should we track a page view on page load
     *       track_pageview: true
     *
     *       // if you set upgrade to be true, the library will check for
     *       // a cookie from our old js library and import super
     *       // properties from it, then the old cookie is deleted
     *       // The upgrade config option only works in the initialization,
     *       // so make sure you set it when you create the library.
     *       upgrade: false
     *
     *       // extra HTTP request headers to set for each API request, in
     *       // the format {'Header-Name': value}
     *       xhr_headers: {}
     *     }
     *
     *
     * @param {Object} config A dictionary of new configuration values to update
     */
    MixpanelLib.prototype.set_config = function(config) {
        if (_.isObject(config)) {
            _.extend(this['config'], config);

            if (!this.get_config('persistence_name')) {
                this['config']['persistence_name'] = this['config']['cookie_name'];
            }
            if (!this.get_config('disable_persistence')) {
                this['config']['disable_persistence'] = this['config']['disable_cookie'];
            }

            if (this['persistence']) {
                this['persistence'].update_config(this['config']);
            }
            Config.DEBUG = Config.DEBUG || this.get_config('debug');
        }
    };

    /**
     * returns the current config object for the library.
     */
    MixpanelLib.prototype.get_config = function(prop_name) {
        return this['config'][prop_name];
    };

    /**
     * Returns the value of the super property named property_name. If no such
     * property is set, get_property() will return the undefined value.
     *
     * ### Notes:
     *
     * get_property() can only be called after the Mixpanel library has finished loading.
     * init() has a loaded function available to handle this automatically. For example:
     *
     *     // grab value for 'user_id' after the mixpanel library has loaded
     *     mixpanel.init('YOUR PROJECT TOKEN', {
     *         loaded: function(mixpanel) {
     *             user_id = mixpanel.get_property('user_id');
     *         }
     *     });
     *
     * @param {String} property_name The name of the super property you want to retrieve
     */
    MixpanelLib.prototype.get_property = function(property_name) {
        return this['persistence']['props'][property_name];
    };

    MixpanelLib.prototype._event_is_disabled = function(event_name) {
        return _.isBlockedUA(userAgent) ||
            this._flags.disable_all_events ||
            _.include(this.__disabled_events, event_name);
    };

    // EXPORTS (for closure compiler)

    // MixpanelLib Exports
    MixpanelLib.prototype['init']                            = MixpanelLib.prototype.init;
    MixpanelLib.prototype['reset']                           = MixpanelLib.prototype.reset;
    MixpanelLib.prototype['track']                           = MixpanelLib.prototype.track;
    MixpanelLib.prototype['register']                        = MixpanelLib.prototype.register;
    MixpanelLib.prototype['register_once']                   = MixpanelLib.prototype.register_once;
    MixpanelLib.prototype['unregister']                      = MixpanelLib.prototype.unregister;
    MixpanelLib.prototype['identify']                        = MixpanelLib.prototype.identify;
    MixpanelLib.prototype['alias']                           = MixpanelLib.prototype.alias;
    MixpanelLib.prototype['set_config']                      = MixpanelLib.prototype.set_config;
    MixpanelLib.prototype['get_config']                      = MixpanelLib.prototype.get_config;
    MixpanelLib.prototype['get_property']                    = MixpanelLib.prototype.get_property;
    MixpanelLib.prototype['get_distinct_id']                 = MixpanelLib.prototype.get_distinct_id;

    // MixpanelPersistence Exports
    MixpanelPersistence.prototype['properties']            = MixpanelPersistence.prototype.properties;
    MixpanelPersistence.prototype['update_search_keyword'] = MixpanelPersistence.prototype.update_search_keyword;
    MixpanelPersistence.prototype['update_referrer_info']  = MixpanelPersistence.prototype.update_referrer_info;
    MixpanelPersistence.prototype['get_cross_subdomain']   = MixpanelPersistence.prototype.get_cross_subdomain;
    MixpanelPersistence.prototype['clear']                 = MixpanelPersistence.prototype.clear;

    _.safewrap_class(MixpanelLib, ['identify', '_check_and_handle_notifications', '_show_notification']);

    var instances = {};
    var extend_mp = function() {
        // add all the sub mixpanel instances
        _.each(instances, function(instance, name) {
            if (name !== PRIMARY_INSTANCE_NAME) { mixpanel_master[name] = instance; }
        });

        // add private functions as _
        mixpanel_master['_'] = _;
    };

    var override_mp_init_func = function() {
        // we override the snippets init function to handle the case where a
        // user initializes the mixpanel library after the script loads & runs
        mixpanel_master['init'] = function(token, config, name) {
            if (name) {
                // initialize a sub library
                if (!mixpanel_master[name]) {
                    mixpanel_master[name] = instances[name] = create_mplib(token, config, name);
                    mixpanel_master[name]._loaded();
                }
                return mixpanel_master[name];
            } else {
                var instance = mixpanel_master;

                if (instances[PRIMARY_INSTANCE_NAME]) {
                    // main mixpanel lib already initialized
                    instance = instances[PRIMARY_INSTANCE_NAME];
                } else if (token) {
                    // intialize the main mixpanel lib
                    instance = create_mplib(token, config, PRIMARY_INSTANCE_NAME);
                    instance._loaded();
                    instances[PRIMARY_INSTANCE_NAME] = instance;
                }

                mixpanel_master = instance;
                if (init_type === INIT_SNIPPET) {
                    win[PRIMARY_INSTANCE_NAME] = mixpanel_master;
                }
                extend_mp();
            }
        };
    };

    var add_dom_loaded_handler = function() {
        // Cross browser DOM Loaded support
        function dom_loaded_handler() {
            // function flag since we only want to execute this once
            if (dom_loaded_handler.done) { return; }
            dom_loaded_handler.done = true;

            DOM_LOADED = true;
            ENQUEUE_REQUESTS = false;

            _.each(instances, function(inst) {
                inst._dom_loaded();
            });
        }

        function do_scroll_check() {
            try {
                document.documentElement.doScroll('left');
            } catch(e) {
                setTimeout(do_scroll_check, 1);
                return;
            }

            dom_loaded_handler();
        }

        if (document.addEventListener) {
            if (document.readyState === 'complete') {
                // safari 4 can fire the DOMContentLoaded event before loading all
                // external JS (including this file). you will see some copypasta
                // on the internet that checks for 'complete' and 'loaded', but
                // 'loaded' is an IE thing
                dom_loaded_handler();
            } else {
                document.addEventListener('DOMContentLoaded', dom_loaded_handler, false);
            }
        } else if (document.attachEvent) {
            // IE
            document.attachEvent('onreadystatechange', dom_loaded_handler);

            // check to make sure we arn't in a frame
            var toplevel = false;
            try {
                toplevel = win.frameElement === null;
            } catch(e) {
                // noop
            }

            if (document.documentElement.doScroll && toplevel) {
                do_scroll_check();
            }
        }

        // fallback handler, always will work
        _.register_event(win, 'load', dom_loaded_handler, true);
    };

    function init_as_module() {
        init_type = INIT_MODULE;
        mixpanel_master = new MixpanelLib();

        override_mp_init_func();
        mixpanel_master['init']();
        add_dom_loaded_handler();

        return mixpanel_master;
    }

    var mixpanel = init_as_module();

    return mixpanel;

}));