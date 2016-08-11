/**
 * connect.js
 * 读取处理异步数据或者上报异步数据的方法
 * rely: Vessel.js, lang.js, json.js
 * owner: rusherwang
 * create: 2016-1-21
 */
!function(window) {
    var lang = Vessel.lang,
        Ajax

    // 待完善 & 的情况
    Ajax = function(mode, settings) {
        this.mode = mode || 'GET'
        this.__construct(settings)
        return this
    }
    Ajax.prototype = {
        __construct: function(settings) {
            return this.send(settings)
        },
        // 构建 XMLHTTP 对象
        _createXMLHttpRequest: function() {
            if (window.XMLHttpRequest) {
                return function() {
                    return new XMLHttpRequest()
                }
            } else if (window.ActiveXObject) {
                return function() {
                    return new ActiveXObject('Microsoft.XMLHTTP')
                }
            }
        }(),
        send: function(settings) {
            var xhr = this._createXMLHttpRequest(),
                method = this.mode.toUpperCase(),
                encode = encodeURIComponent,
                url = settings.url || '/',
                data = settings.data || {},
                async = settings.async || true,
                dataType = settings.dataType && settings.dataType.toUpperCase() || '',
                callback = settings.callback || function() {},
                formatUrlFlag = lang.strstr('?', url),
                param = [],
                key, value, devide,
                _send = function(method, url, data, async) {
                    var res
                    xhr.open(method, url, async)
                    // 回调函数的绑定，这里可以完善成各种状态的
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            res = xhr.responseText
                            if (dataType === 'JSON') res = lang.JSON.decode(res)
                            callback(res)
                        }
                    }
                    if (method === 'POST') {
                        xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
                    }
                    xhr.send(data)
                }

            // 将 data 数据转化成字符串
            if (lang.isObject(data)) {
                for (key in data) {
                    value = lang.isString(data[key]) ? data[key] : lang.JSON.encode(data[key])
                    param.push(encode(key) + '=' + encode(value))
                }
                data = param.join('&')
            } else if (lang.isString(data)) {
                data = encode(data)
            } else {
                data = 'data=' + encode(lang.JSON.encode(data))
            }

            // 如果在 url 里面已经加入了部分参数，就需要进行转化
            if (method === 'GET') {
                url += data && ((formatUrlFlag ? '&' : '?') + data) || ''
                _send(method, url, null, async)
            } else if (method === 'POST') {
                if (formatUrlFlag) {
                    devide = url.split('?')
                    url = devide[0]
                    data += '&' + devide[1]
                }
                _send(method, url, data, async)
            }
            return
        }
    }


    var connect = {
            get: function(settings) {
                return new Ajax('GET', settings)
            },
            post: function(settings) {
                return new Ajax('POST', settings)
            },
            load: function(type, settings) {
                type = (type + '').toUpperCase()
                if (type === 'GET' || type === 'POST') {
                    return new Ajax(type, settings)
                } else if (type === 'GETJSON') {
                    settings.dataType = 'JSON'
                    return new Ajax('GET', settings)
                }
            }
        }

    Vessel.extend('util.connect', connect)
}(window)