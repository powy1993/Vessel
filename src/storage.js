/**
 * storage.js
 * 读取用户本地存储以及写入
 * rely: Vessel.js, lang.js, json.js
 * owner: rusherwang
 * create: 2016-1-20
 */
!function(window) {
    var lang = Vessel.lang,
        dateReg = /[\u5e74\u6708\u65e5\-:\/]/,
        // 这里的检测方案用了完善的特性检测
        // 因为在某些版本的IE开启保护模式之后虽然有 localStorage
        // 但是无法使用，使用的时候会报错并抛出内存溢出的错误
        _isLocalStorageSupported = function() {
            try {
                var local = 'localStorage' in window && window['localStorage']
                local.setItem('__Vessel__', 'Vessel')
                if (local.getItem('__Vessel__') !== 'Vessel') {
                    return false
                }
                local.removeItem('__Vessel__')
                return local ? true : false
            } catch(e) {
                return false
            }
        }()

    if (!_isLocalStorageSupported) {
        Vessel.console.warn('Your browser cannot support "localStorage", please use "cookie" instead.')
    } else {
        // 这里因为 session 和 local 的方法是一致的 所以构建一个 Storage 原型
        var Storage = function(mode, expiredEnabled) {
                this.mode = mode
                this.expiredEnabled = expiredEnabled
                return this
            }
        Storage.prototype = {
            // 获取本地存储失效日期的对象
            getExpired: function() {
                var expired = this.mode.getItem('__expired__')
                return !lang.isEmpty(expired) && lang.JSON.decode(expired) || {}
            },
            // 保存本地存储失效日期，如果发现传了错误的参数则移除，防止出错
            saveExpired: function(expiredGroup) {
                if (lang.isObject(expiredGroup)) {
                    this.mode.setItem('__expired__', lang.JSON.encode(expiredGroup))
                    return true
                } else {
                    this.remove('__expired__')
                    return false
                }
            },
            // 获取 Storage 的方法，如果设置了 decode 为 JSON 则解析为对象
            get: function(k, decode) {
                if (!lang.isString(k)) return
                var expiredGroup = this.getExpired(),
                    value
                if (this.expiredEnabled &&
                    lang.isSet(expiredGroup[k]) &&
                    +expiredGroup[k] <= +new Date) {
                    // 如果过期了就直接移除
                    this.remove(k)
                    return
                }
                value = this.mode.getItem(k)
                if (lang.isString(decode) && decode.toUpperCase() === 'JSON') {
                    value = lang.JSON.decode(value)
                }
                return value
            },
            // 设置 Storage 的方法，可以设置过期时间
            set: function(k, value, expired) {
                var expiredTime, expiredGroup
                this.mode.setItem(k, lang.isString(value) ? value : lang.JSON.encode(value))
                if (this.expiredEnabled && lang.isSet(expired)) {
                    expiredTime = dateReg.test(expired) ? lang.getTime(expired) : lang.getTime(+new Date, expired)
                    // 这里将日期对象重新打包进行存储
                    expiredGroup = this.getExpired()
                    expiredGroup[k] = expiredTime
                    this.saveExpired(expiredGroup)
                }
                return 
            },
            // 移除 Storage 的方法
            remove: function(k) {
                var expiredGroup = this.getExpired()
                if (this.expiredEnabled && lang.isSet(expiredGroup[k])) {
                    // 也要移除相应的日期数据
                    delete expiredGroup[k]
                    this.saveExpired(expiredGroup)
                }
                return this.mode.removeItem(k)
            },
            // 清空 Storage 的方法
            clear: function() {
                return this.mode.clear()
            }
        }
        Vessel.extend('util.local', new Storage(window.localStorage, true))
        Vessel.extend('util.session', new Storage(window.sessionStorage, false))
    }
}(window)