!(function(window) {
    // 将 new 放在内部可以无需在调用的时候 new Vessel()
    // 所以这边用 原型链上的 init 作为构造函数
    // 但是这样带来的问题就是 this 的原型链上方是空的，调用不到方法
    // 后来将 init 的原型指向 Vessel 原型就可以了
    var Vessel = function(selector, context) {
        return new Vessel.prototype.init(selector, context)
    }

    Vessel.prototype = {
        constructor: Vessel,
        selector: '',
        length: 0
    }

    Vessel.fn = Vessel.prototype

    Vessel.extend = Vessel.fn.extend = function(key, value, force) {
        if (typeof value === 'undefined') return
        var target = this,
            targetName = key.split('.'),
            len = targetName.length,
            thisTargetName,
            i

        var warnExtend = function(extra) {
                Vessel.console.warn('Extension has been declared already, you are suggested to change your extension name.(' + extra + ' is not empty)')
            },
            isset = function(o) {
                return typeof o !== 'undefined'
            },
            isArray = function(o) {
                return Object.prototype.toString.call(o) === '[object Array]'
            },
            checkExtend = function(tar, thisKey, copy, warnExtra) {
                var i
                if (typeof tar[thisKey] === 'object' &&
                    typeof copy === 'object' &&
                    !isArray(tar[thisKey]) &&
                    !isArray(copy)) {
                    tar = tar[thisKey]
                    for (i in copy) {
                        checkExtend(tar, i, copy[i], warnExtra + ' => ' + i)
                    }
                } else {
                    if (!isset(tar[thisKey])) {
                        tar[thisKey] = copy
                    } else {
                        force && (tar[thisKey] = copy)
                        warnExtend(warnExtra)
                    }
                }
            }

        for (i = 0; i < len - 1; ++i) {
            thisTargetName = targetName[i]
            if (thisTargetName !== '') {
                if (typeof target[thisTargetName] === 'undefined') {
                    target[thisTargetName] = {}
                }
                target = target[thisTargetName]
            }
        }
        thisTargetName = targetName[i]
        checkExtend(target, thisTargetName, value, targetName.join(' => '))
        return this
    }

    Vessel.version = '1.0.1'

    // 消息通知，后续单独写出来
    Vessel.console = {}
    Vessel.console.warn = function(log) {
        typeof window.console === 'object' && window.console.warn(log)
    }

    window.Vessel = window.V = Vessel
    !window.$ && (window.$ = Vessel)
})(window)