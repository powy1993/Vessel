/**
 * json.js
 * 提供解析以及将对象 Object 解析为 JSON 的方法
 * 主要参考来源于 http://www.json.org/  json2.js
 * rely: Vessel.js, lang.js
 * owner: rusherwang
 * create: 2016-1-8
 */
!function() {
    var lang = Vessel.lang
        // DANGEROUS_REG 这里面的字符并没有什么意义，转义出来也是空，
        // 过滤掉的原因是有些浏览器在直接解析的时候会转义错误
    var DANGEROUS_REG = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        // ESCAPE_REG 这里面的字符有一定的含义，但会干扰判断，所以要转义成 unicode 字符串，
        // 例如汉字、字母、符号等，注意这里已将 ']' 替换成了 \\u005d
        // 所以后续判断是否合法值的时候可以使用 ']'
        // 使用 ']' 的主要原因是不需要再次过滤数组的结束括号
        ESCAPE_REG = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        // UNICODE_CHANGE_REG 主要用于将 字母、汉字、符号 的 unicode 字符串替换成 '@'
        // 因为这些值都是有意义的，这里替换的是类似 \\u0000 或者 \\b 的值
        UNICODE_CHANGE_REG = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
        // VALUE_CHANGE_REG 主要用于将 字符串空、布尔值、空对象、数字 等替换为 ']'
        // 注意数字可能会有 1E+3(1000) 这种形式
        VALUE_CHANGE_REG = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        // ARRAY_CHANGE_REG JSON串中可以解析成数组，
        // 所以这里将前一步转化出来的 :[](对象的值是数组) 或者 ^[](数组) 或者 ,[](数组中包含数组)中的 (?)[ 去掉，因为这些是合法的
        ARRAY_CHANGE_REG = /(?:^|:|,)(?:\s*\[)+/g,
        // INVALID_REG 如果验证通过，则这个 JSON串 是可以被直接运行解析的
        INVALID_REG = /^[\],:{}\s]*$/,
        // CHARS 映射和转义公共转义字符以及特殊字符
        // 这些字符虽然匹配 ESCAPE_REG 但不进行 unicode 替换，而是直接映射
        CHARS = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        }

    var _consoleWarn = function(s) {
            return typeof console === 'object' && console.warn(s) || false
        },
        // 将特殊字符进行 unicode 转码使之变成 unicode 字符串 或者 特殊转义字符
        _toUnicode = function(c) {
            return CHARS[c] ? CHARS[c] : '\\u' + ('0000' + (+(c.charCodeAt(0))).toString(16)).slice(-4)
        },
        // 替换过滤某些特殊的空字符，避免在某些浏览器中出现转义错误
        _prepare = function(s) {
            return lang.isString(s) && s.replace(DANGEROUS_REG, _toUnicode)
        },
        // 特殊字符转义成 unicode 字符串
        _escape = function(s) {
            return '"' + s.replace(ESCAPE_REG, _toUnicode) + '"'
        },
        // 检查是否是合法的 JSON 字符串
        _isValid = function(s) {
            s = _prepare(s)
            return s && INVALID_REG.test(s.
                        replace(UNICODE_CHANGE_REG, '@').
                        replace(VALUE_CHANGE_REG, ']').
                        replace(ARRAY_CHANGE_REG, '')
                    )
        },
        // 将 JSON 字符串转成 对象
        _makeDecode = function(s, fn) {
            return _isValid(s) ? fn(s)
                               : _consoleWarn('Your param => ' + (lang.type(s) === 'string'
                               ? '\'' + s + '\''
                               : 'type:' + lang.type(s)) + ' <= is not a valid JSON string.')
        },
        // 将 对象 转成 JSON 字符串
        // 这里进行了深度递归的遍历产生字符串
        // Function 类的直接被过滤掉，暂时没有更好的方式
        _makeEncode = function(o) {
            var oType = lang.type(o),
                len,            // 数组情况下用到的变量
                k, v, index,    // 对象情况下用到的变量
                result = []
            switch (oType) {
                case 'string' : return _escape(o)
                case 'number' : return isFinite(o) ? String(o) : 'null'
                case 'boolean':
                case 'null'   : return String(o)
                case 'date'   : return _escape(lang.formatDate(o))
                case 'array'  :
                    len = o.length
                    while (len--) {
                        result[len] = _makeEncode(o[len]) || 'null'
                    }
                    return '[' + result.join(',') + ']'
                case 'object' :
                    index = 0
                    for (k in o) {
                        // 这里不能包含原型链向上的值
                        if (lang.isString(k) && lang.hasOwnProperty(o, k)) {
                            v = _makeEncode(o[k])
                            if (v) {
                                result[index++] = _escape(k) + ':' + v
                            }
                        }
                    }
                    // 这里排序是为了让转出来的字符串更美观
                    result.sort()
                    return '{' + result.join(',') + '}'
                default       : return undefined
            }
        }

    var lang = Vessel.lang,
        json = {
            isValid: _isValid,
            decode: function() {
                // 如果可以使用原生 JSON.parse 的话，使用原生的 parse
                if (lang.isObject(window.JSON) && JSON.parse) {
                    return function(s) {
                        return _makeDecode(s, JSON.parse)
                    }
                } else {
                    return function(s) {
                        return _makeDecode(s, function(s) {
                            return eval('(' + s + ')')
                        })
                    }
                }
            }(),
            // 这里不使用 JSON.stringify 的原因是它可能无法很好地处理 Date 类
            encode: _makeEncode
        }
    Vessel.extend('lang.JSON', json)
}()