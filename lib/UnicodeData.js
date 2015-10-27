define([
    'require/text!./ucd/UnicodeData.txt'
  , './UnicodeChar'
  , './tools/hexKeyFromCodePoint'
], function (
    unicodeData
  , UnicodeChar
  , hexKeyFromCodePoint
) {
    "use strict";

    function CharDataPointer(lineStart, lineEnd) {
        this._start = lineStart;
        this._end = lineEnd;
    }
    CharDataPointer.prototype = Object.create(null);
    CharDataPointer.prototype.getData = function() {
        return unicodeData.slice(this._start, this._end).trim();
    };

    function UnicodeData() {
        this._chars = this._initChars(unicodeData);
    }
    var _p = UnicodeData.prototype;

    // factory or constructor, must return or create a new Object
    _p._CharConstructor = UnicodeChar.FromString;

    _p._initChars = function (unicodeData) {
        var chars = Object.create(null)
          , index = 0
          , lbr, line, data
          , key
          , pointer
          ;

        while(true) {
            lbr = unicodeData.indexOf('\n', index);
            if(lbr === -1)
                break;
             if(index === lbr || unicodeData[index] === '#')
                continue;

            pointer = new CharDataPointer(index, lbr);

            // prepare next iteration
            index = lbr + 1;

            line = pointer.getData();
            key = line.slice(0, line.indexOf(';')).trim();

            // Assert, turned of because it did not yield. Turn on when in doubt.
            if(key !== hexKeyFromCodePoint(parseInt(key, 16)))
                throw new Error('hexKeyFromCodePoint is broken: '
                            + key + ' => '
                            + parseInt(key, 16) + ' => '
                            + hexKeyFromCodePoint(parseInt(key, 16)));
            chars[key] = pointer;
        }

        return chars;
    };

    _p.get = function(codePoint, fallback) {
        var key = hexKeyFromCodePoint(codePoint)
          , data = this._chars[key]
          ;
        if(data === undefined) {
            if(arguments.length >= 2)
                return fallback;
            // KeyError
            throw new Error('codePoint ' + key + ' not found.');
        }
        if(data instanceof CharDataPointer)
            // initialize
            this._chars[key] = data = new this._CharConstructor(data.getData());

        return data;
    };

    Object.defineProperty(_p, 'keys', {
        get: function(){ return Object.keys(this._chars);}
      , enumerable: true
    });

    return UnicodeData;
});
