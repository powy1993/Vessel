/**
 * cookie.js
 * 读取用户本地cookie以及写入
 * rely: Vessel.js, lang.js, json.js
 * owner: rusherwang
 * create: 2016-1-13
 */
!function() {
    var lang = Vessel.lang,
        dateReg = /[\u5e74\u6708\u65e5\-:\/]/,
        // 分割传入地址，使之变成 domain 和 path 形式
        locationReg = /^(?:http(?:s)?:\/\/)?([^\/]+)?(\/[^\?]+)?/,
        _warn = function(s) {
            Vessel.console.warn('Cannot set cookie with "' + s + '" because you are located in "' + window.location.href + '"')
        },
        // 创建可以赋值给 document.cookie 的单个cookie键值对
        // expires <Date> cookie的有效期限
        // location <String> cookie存储路径
        // options 里包括了一些cookie的参数包括
        // encode <Boolean> cookie是否进行编码
        // secure <Boolean> 是否是 https 保护 cookie
        _createCookieString = function(key, value, expires, location, options) {
            // 如果键不是字符或者为空 则返回 false
            if (!lang.isString(key) || key === '') return false
            var cookieText = encodeURIComponent(key) + '=',
                locationDevide, domain, path
            if (lang.isObject(options)) {
                // 这里的参数是是否需要对参数进行编码，不编码可能造成无法正常存储
                // 这就要求在读取的时候也需要进行相应的操作
                if (options.encode === false) {
                    cookieText += value
                } else {
                    cookieText += encodeURIComponent(value)
                }
                // 这里是保护参数设置
                if (options.srcure === true) {
                    cookieText += '; secure'
                }
            } else {
                // 默认使用了编码对 value 进行编译
                cookieText += encodeURIComponent(value)
            }
            if (lang.isDate(expires)) {
                // GMT 时间在浏览器调试上看和你理想的时间不符合但是实际上是正确的，因为有时区差
                cookieText += '; expires=' + expires.toGMTString()
            }
            if (lang.isString(location) && location !== '') {
                locationDevide = location.match(locationReg)
                if (lang.isArray(locationDevide)) {
                    domain = locationDevide[1]
                    path = locationDevide[2]
                    // 这里是路径参数设置
                    if (lang.isString(domain)) {
                        cookieText += '; domain=' + domain
                        // 这里要判断域是否是被允许的
                        if (!lang.strstr(domain, window.location.hostname)) {
                            _warn('domain=' + domain)
                            return false
                        }
                    }
                    // 这里是域名参数设置
                    if (lang.isString(path)) {
                        cookieText += '; path=' + path
                        // 这里要判断路径是否是被允许的
                        if (!lang.strstr(path, window.location.pathname)) {
                            _warn('path=' + path)
                            return false
                        }
                    } else {
                        cookieText += '; path=/'
                    }
                }
            } else {
                cookieText += '; path=/'
            }
            console.log(cookieText);
            return cookieText
        },
        _makeCookieValue = function(s) {
            return lang.isString(s) ? s : lang.JSON.encode(s)
        },
        _decodeCookie = function(str, decode) {
            return decode === false ? str : decode === 'JSON' ?
                    lang.JSON.decode(decodeURIComponent(str)) :
                    decodeURIComponent(str)
        },
        // 取单个 cookie 用正则是最快的
        _getCookie = function(cookie, key, decode) {
            var reg = new RegExp('(?:^|;+|\\s+)' + key + '=([^;]*)'),
                res = cookie.match(reg)
            return res && res[1] ? _decodeCookie(res[1], decode) : ''
        },
        // 这里是将 cookie 所有的键值取出来变成一个对象
        _getAllCookie = function(cookie, decode) {
            var cookieParts = cookie.split(' '),
                len = cookieParts.length,
                cookieKeyAndValue,
                res = {}
            while (len--) {
                cookieKeyAndValue = cookieParts[len].split('=')
                if (cookieKeyAndValue.length >= 2) {
                    res[encodeURIComponent(cookieKeyAndValue[0])] = _decodeCookie(cookieKeyAndValue[1], decode)
                }
            }
            return res
        }

    var cookie = {
            get: function(k, decode) {
                decode = lang.isString(decode) ? decode.toUpperCase() : decode
                return lang.isString(k) ? _getCookie(document.cookie, k, decode)
                                        : _getAllCookie(document.cookie, decode)
            },
            set: function(k, v, expires, location, options) {
                    // 兼容不同形式的过期时间
                var cookieExpiredDate = expires ?
                                            new Date(dateReg.test(expires) ?
                                                lang.getTime(expires) :
                                                lang.getTime(+new Date, expires)) :
                                            '',
                    cookieString = _createCookieString(k, _makeCookieValue(v), cookieExpiredDate, location, options)

                return !cookieString || !!(document.cookie = cookieString)
            },
            // 这里要注意如果 path 和 domain 不对应是不能移除的
            remove: function(k, options) {
                if (!lang.isString(k)) return false
                document.cookie = _createCookieString(k, '', new Date(0), options)
                return true
            }
        }

    Vessel.extend('util.cookie', cookie)
}()