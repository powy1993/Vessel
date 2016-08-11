/**
 * promise.js
 * 简易控制数据获取和回调装置
 * rely: Vessel.js, lang.js, connect.js
 * owner: rusherwang
 * create: 2016-4-1 (Happy April Fool's day)
 */
!function() {
    var lang = Vessel.lang,
        connect = Vessel.util.connect,
        STATE = {
            READY: 0,       // 准备中
            STOP: 1,        // 已搁置或已结束
            RUNNING: 2,     // 运行中
            WAITING: 3      // 正在等待
        },
        // 内部方法
        set, push, need, when, parse,
        // 暴露的构造函数
        Promise, Defer, proto

    // 同步声明函数
    Promise = function(param) {
        return new Promise.prototype.init(param, false)
    }
    
    proto = Promise.prototype = {
        constructor: Promise
    }
    // 异步声明函数
    Defer = function(param) {
        return new Promise.prototype.init(param, true)
    }

    // 构造函数
    proto.init = function(param, defer) {
        this.data = {}
        this.eventLine = []
        this.whenList = []
        this.state = STATE.READY
        return defer ? this.defer(param) : this.promise(param)
    }
    proto.init.prototype = proto

    // 设置数据值
    set = function(param) {
        var key
        // 如果不是对象格式的数据，直接退出
        if (!lang.isObject(param)) return this
        for (key in param) {
            this.data[key] = param[key]
        }
        when.call(this)
        return this
    }
    // 将事件叠入列表
    // inCase 为真时表示是 when，一旦含有某数据就会执行
    // fromNow 为真时表示插入到事件队列的最前端，优先执行
    push = function(fn, inCase, fromNow) {
        ;(inCase ? this.whenList : this.eventLine)[fromNow ? 'unshift' : 'push'](fn)
        return this.state !== STATE.RUNNING ? this.run() : this
    }

    // 是否拥有项里面的所有数据
    // 这里本来可以添加缓存，表示数据已经被检查过一次了
    // 但是考虑到可能被异步改变值而导致出错，所以没加
    need = function(needData) {
        return lang.contain(needData, this.get())
    }

    // 对 whenList 堆叠的事件进行操作
    when = function() {
        var listener = this.whenList,
            len = listener.length,
            value
        while (len--) {
            value = listener[len]
            if (need.call(this, value.need)) {
                // 从等待队列里面移除事件并执行（因为前面已经判断符合执行条件了）
                // 这里不能先执行再移除，可能会导致死循环
                listener.splice(len, 1)[0].fn.call(this)
            }
        }
        return
    }

    // 对 a.b = c 这种字符串进行转化，适配成对象形式
    // 实现方式是先 切割 '.' 形成一个有层级的对象
    // 再切割 '=' ，如果有的话将值赋入，如果没有的话作为一个必须键存入
    parse = function(o) {
        var type = lang.type(o),
            res = [],
            len, value,
            part, partLen, i, temp, t, layer
        if (type !== 'array') return o
        len = o.length
        while (len--) {
            value = o[len]
            if (lang.isString(value)) {
                temp = t = {}
                part = value.split('.')
                partLen = part.length
                for (i = 0; i < partLen - 2; ++i) {
                    t = t[part[i]] = {}
                }
                layer = part[partLen - 1].split('=')
                if (layer.length === 2) {
                    t = t[part[i]] = {}
                    // 如果可以转成数字就转成数字
                    t[layer[0]] = isNaN(+layer[1]) ? layer[1] : +layer[1]
                } else {
                    t[part[i]] = [layer[0]]
                }
                res[len] = partLen === 1 ? o[len] : temp
            } else {
                res[len] = o[len]
            }
        }
        return res
    }

    // 检查是否含有了某批数据
    proto.has = function(key) {
        return lang.isSet(this.data[key])
    }
    // 批量设置值
    proto.set = function(param, value) {
        var o = {}
        if (lang.isString(param) && lang.isSet(value)) {
            // 如果传入的是 key => value 形式就进行转化
            o[param] = value
            param = o
        }
        set.call(this, param)
        return this.run()
    }
    // 获取某个值
    // 缺省 key 的话会返回所有值
    proto.get = function(key, byValue) {
        var data = this.data,
            part = lang.isSet(key) ? key.split('.') : [],
            len = part.length,
            i = 0
        for (; i < len; ++i) {
            if (!lang.isSet(data[part[i]])) return
            data = data[part[i]]
        }
        return byValue ? lang.clone(data) : data
    }
    // 在当前执行步骤承诺某数据
    proto.promise = function(param) {
        return push.call(this, function() {
            set.call(this, param)
        })
    }
    // 在当前执行步骤承诺异步内容
    proto.defer = function(param) {
        var that = this,
            fn = function() {
                lang.each(param, function(key, value) {
                    var type = lang.type(value),
                        callback = function(data) {
                            var param = {}
                            param[key] = data
                            that.set(param)
                        }
                    if (type === 'array') {
                        value = {
                            type: value[0],
                            url: value[1],
                            data: value[2]
                        }
                    }
                    value.callback = callback
                    connect.load(value.type, value)
                })
            }
        return push.call(this, fn)
    }

    // 事件队列叠入
    // 当含有 o 里面的数据时，才执行 fn
    // 可以不设置 o ，这样就是直接执行 fn
    proto.then = function(fn) {
        return push.call(this, fn)
    }
    // 一旦拥有某些数据，就执行
    proto.when = function(o, fn) {
        var oType = lang.type(o),
            len = arguments.length,
            needData = [],
            whenEvent, i
        // 处理各种传入参数
        if (oType === 'string' ||
            oType === 'object' && len > 2) {
            fn = arguments[len - 1]
            for (i = 0; i < len - 1; ++i) {
                needData.push(arguments[i])
            }
        } else if (oType === 'array' || oType === 'object') {
            needData = lang.clone(o)
        }
        whenEvent = {
            need: parse(needData),
            fn: fn
        }
        return push.call(this, whenEvent, true)
    }
    // 事件等待
    // 这里是运行到这个函数的时候置一个状态位，表示正在等待
    // 之后设置一个延时把这个状态位改回来，期间遇到的任何执行都会被忽略
    proto.wait = function(ms, fromNow) {
        var that = this,
            fn = function() {
                this.state = STATE.WAITING
                this.eventLine.shift()
                setTimeout(function() {
                    that.forceRun()
                }, ms)
                return false
            }
        return push.call(this, fn, false, fromNow)
    }
    // 将此承诺拒绝，没有执行完的步骤将会被舍弃
    // 可以在确定已经全部步骤执行完了之后调用(或者 when 里面的事件不再需要)
    // 主要是为了清理内存
    proto.reject = function() {
        this.data = null
        this.eventLine = null
        this.whenList = null
        return
    }
    // 判断是否有某些变量，如果不存在，则会阻塞
    proto.need = function(o) {
        var oType = lang.type(o),
            needData = [],
            len = arguments.length,
            fn = function(needData) {
                return function() {
                    this.state = STATE.STOP
                    return need.call(this, needData)
                }
            }
        if (oType === 'string' ||
            oType === 'object' && len > 2) {
            while (len--) {
                needData.push(arguments[len])
            }
        } else if (oType === 'array' || oType === 'object') {
            needData = lang.clone(o)
        }
        return push.call(this, fn(parse(needData)))
    }
    // 执行一次队列中的函数
    proto.run = function(force) {
        var thisEvent = this.eventLine[0]
        if (force) {
            this.state = STATE.READY
        }
        if (this.state === STATE.WAITING ||
            this.state === STATE.RUNNING) return this
        if (!thisEvent) {
            this.state = STATE.STOP
            return this
        }
        this.state = STATE.RUNNING
        if (thisEvent.call(this) === false) {
            return this
        } else {
            this.state = STATE.READY
            this.eventLine.shift()
            return this.run()
        }
    }
    proto.forceRun = function() {
        return this.run(true)
    }

    Vessel.extend('util.promise', Promise).extend('util.defer', Defer)
}()