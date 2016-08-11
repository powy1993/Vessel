/**
 * lang.js
 * 扩展语言方法
 * rely: Vessel.js
 * owner: rusherwang
 * create: 2015-12-29
 */
!function() {
    // 这里声明了常量
    var OBJECT_PROTOTYPE  = Object.prototype,
        ARRAY_PROTOTYPE   = Array.prototype,
        TOSTRING          = OBJECT_PROTOTYPE.toString,
        ARRAY_TOSTRING    = '[object Array]',
        FUNCTION_TOSTRING = '[object Function]',
        FUNCTION_REG      = /^(function\s*)(\w*\b)/,
        // 任意英文字母或者数字用于驼峰匹配
        CAMEL_REG         = /[-_]([\da-z])/gi,
        RUNNING_REG       = /\{\{(.*?)\}\}/g,
        // 将时间值和单位分开
        TIMEDIFF_REG      = /([+\-]?\d+)\s*([a-zA-Z]+)/,
        // 这里对传入的字符串进行过滤，不符合日期型字符串的字符过滤掉
        DATE_CLEAR_REG    = /[^\d\/\s\/:]|\/(?=\s)|\/$/g,
        // 将 年、月、日 替换成 '/'
        DATE_EXCHANGE_REG = /[\u5e74\u6708\u65e5\-]/g,
        // 这个是用来匹配前后空白字符
        TRIM = /^[\s\ufeff\xa0]+|[\s\ufeff\xa0]+$/g,
        TIME_EXCHANGE     = {
            'S': 1E3,
            'I': 6E4,
            'H': 3.6E6,
            'D': 8.64E7,
            'M': 2.6784E9,
            'Y': 3.1536E10
        },
        TIME_GET_FUNCTION = {
            S: function(d) {
                return d.getSeconds()
            },
            // 这里因为M为月份占用了,所以使用了I代替
            I: function(d) {
                return d.getMinutes()
            },
            H: function(d) {
                return d.getHours()
            },
            D: function(d) {
                return d.getDate()
            },
            M: function(d) {
                return d.getMonth() + 1
            },
            Y: function(d) {
                return d.getFullYear()
            }
        },
        CAMEL_REPLACE_FUNCTION = function(all, letter) {
            return letter.toUpperCase()
        }

    var typeCheck, tool
    // 关于数据类型判断的方法
    typeCheck = {
        type: function(o) {
            return o == null ? o + ''
                             : typeof o === 'object' || typeof o === 'function'
                             ? TOSTRING.call(o).slice(8, -1).toLowerCase()
                             : typeof o
        },
        isUndefined: function(o) {
            return typeof o === 'undefined'
        },
        isNull: function(o) {
            return o === null
        },
        isSet: function(o) {
            return o != null
        },
        isBoolean: function(o) {
            return typeof o === 'boolean'
        },
        isNumber: function(o) {
            // 这里将 NaN 和 Infinity 不归结为number类型,符合一般场景的使用需求
            return typeof o === 'number' && isFinite(o)
        },
        isString: function(o) {
            return typeof o === 'string'
        },
        isDate: function(o) {
            return typeCheck.type(o) === 'date'
        },
        isArray: function(o) {
            return TOSTRING.call(o) === ARRAY_TOSTRING
        },
        // 判断是不是一个类数组对象
        isArrayLike: function(o) {
            var length = !!o && 'length' in o && o.length,
                type = typeCheck.type(o)

            if (type === 'function' || o === window) {
                return false
            }
            return type === 'array' || length === 0 ||
                typeof length === 'number' && length > 0 && (length - 1) in o
        },
        // 这里的判断会在特殊情况下不准确,因为IE9-对BOM对象的方法返回"object"
        // 例如 window, document, location, history 等对象
        isFunction: function(o) {
            return TOSTRING.call(o) === FUNCTION_TOSTRING
        },
        isObject: function(o) {
            // 这里排除了节点类型的对象
            return typeof o === 'object' && !o.nodeType && !typeCheck.isArray(o) || false
        },
        isEmpty: function(o) {
            var oType = typeCheck.type(o),
                i
            if (oType === 'array' || oType === 'object') {
                for (i in o) return false
                return true
            } else {
                return oType === 'boolean' ? o : !o
            }
        },
        // 这个方法检测这个属性是否来源于对象本身，而不是通过原型继承的
        hasOwnProperty: OBJECT_PROTOTYPE.hasOwnProperty ? function(o, prop) {
            return o && o.hasOwnProperty(prop)
        } : function(o, prop) {
            return !typeCheck.isUndefined(o[prop]) &&
                    o.constructor.prototype[prop] !== o[prop]
        }
    }
    // 一些实用的工具函数
    tool = {
        // 去除字符串前后空格
        trim: function(s) {
            return !typeCheck.isSet(s) ? '' : (s + '').replace(TRIM, '')
        },
        // 将带有 - 的字符串转为驼峰形式
        camelCase: function(s) {
            return s.replace(CAMEL_REG, CAMEL_REPLACE_FUNCTION)
        },
        // 获得一个节点的标签名或者判断一个节点的标签名是否和 name 一致
        tagName: function(node, name) {
            n = node.nodeName && node.nodeName.toLowerCase()
            return name ? n === name.toLowerCase() : n
        },
        // 适配进制
        parse: function(num, from, to) {
            if (typeCheck.isUndefined(to)) {
                // 如果 to 缺省那就用 from 代替，符合使用场景
                // 即如果使用 parse(100, 2) 是需要将 100(10) 转成 2进制
                // 如果使用 parse(100, 16, 2) 是需要将 100(16) 转成 2进制
                to = from
                from = undefined
            }
            if (from) {
                num = parseInt(num + '', +from)
            }
            if (to) {
                num = (+num).toString(+to)
            }
            return num
        },
        // 比较两个值是否相等
        // 可以用来比较数组或者对象或者函数内容是否一致
        equal: function(o1, o2) {
            var o1Type = typeCheck.type(o1),
                o2Type = typeCheck.type(o2),
                i, len
            if (o1Type !== o2Type) return false
            if (o1Type === 'number') {
                return o1 === o2 || isNaN(o1) && isNaN(o2)
            } else if (o1Type === 'array') {
                len = o1.length
                if (len !== o2.length) return false
                while (len--) {
                    if (!tool.equal(o1[len], o2[len])) return false
                }
                return true
            } else if (o1Type === 'object') {
                len = 0
                for (i in o1) {
                    if (typeCheck.hasOwnProperty(o1, i) && !tool.equal(o1[i], o2[i])) return false
                    len++
                }
                for (i in o2) {
                    len--
                }
                return len ? false : true
            } else if (o1Type === 'date') {
                return +o1 === +o2
            } else if (o1Type === 'function') {
                // 声明函数的方式可能会影响 toString 结果，所以用 replace 格式化
                return o1.toString().replace(FUNCTION_REG, '$1') === o2.toString().replace(FUNCTION_REG, '$1')
            } else {
                return o1 === o2
            }
        },
        // 输出 o2 是否包含 o1
        // 可以用来比较数组或者对象或者函数内容是否有包含关系
        // 注：这里认为 1 被 [1, 2] 包含, ['a', 'b'] 被 {'a': 1, 'b': 2} 包含
        contain: function(o1, o2) {
            var o1Type = typeCheck.type(o1),
                o2Type = typeCheck.type(o2),
                key, len, i
            if (o1Type === 'string' || o1Type === 'number') {
                if (o2Type === 'number') {
                    return o1 === o2
                } else if (o2Type === 'string') {
                    return tool.strstr(o1, o2)
                } else if (o2Type === 'array') {
                    return tool.arrarr(o1, o2)
                }
            } else if (o1Type === 'array') {
                len = o1.length
                for (i = 0; i < len; ++i) {
                    if (typeCheck.isObject(o1[i])) {
                        if (!tool.contain(o1[i], o2)) return false
                    } else {
                        if (o2Type === 'array') {
                            if (!tool.arrarr(o1[i], o2)) return false
                        } else if (o2Type === 'object') {
                            if (!typeCheck.isSet(o2[o1[i]])) return false
                        } else {
                            return false
                        }
                    }
                }
                return true
            } else if (o1Type === 'object') {
                if (o2Type === 'object') {
                    for (key in o1) {
                        if (!typeCheck.isSet(o2[key]) || !tool.contain(o1[key], o2[key])) return false
                    }
                    return true
                }
            }
            return false
        },
        // 克隆方法可以使对象或者数组独立，旧对象或者数组修改时，不再影响克隆对象，反之亦然
        clone: function(o) {
            var oType = typeCheck.type(o),
                result,
                key, len, i
            // 如果是节点类型的则克隆节点
            // 这里要注意IE9-将DOM节点理解成'object'
            if (tool.strstr('html', oType) ||
                oType === 'object' && !typeCheck.isObject(o)) {
                return o.cloneNode && o.cloneNode(true) || o
            }
            // 如果是对象或者数组
            if (oType === 'array') {
                result = []
                len = o.length
                for (i = 0; i < len; ++i) {
                    result[i] = tool.clone(o[i])
                }
                return result
            }
            // 如果是window则不克隆，防止IE9-出错
            if (oType === 'object' && o !== window) {
                result = {}
                for (key in o) {
                    result[key] = tool.clone(o[key])
                }
                return result
            }
            return o
        },
        merge: function(first, second) {
            var len = +second.length,
                i = +first.length,
                j = 0

            while (j < len) {
                first[i++] = second[j++]
            }

            // 兼容 IE < 9
            // 为一些类数组对象查询到的 length 等于 NaN 而准备
            // 例如: NodeLists
            if (len !== len) {
                while (second[j] !== undefined) {
                    first[i++] = second[j++]
                }
            }

            first.length = i
            return first
        },
        // 这个方法可以尽可能地合并对象
        union: function(o1, o2) {
            // 这里需要深度克隆对象或者数组，防止在引用传递的时候互相污染
            o1 = tool.clone(o1)
            o2 = tool.clone(o2)
            var result, deepCopy
            if (typeCheck.isArray(o1)) {
                return o1.concat(o2)
            }
            if (typeCheck.isObject(o1)) {
                if (!typeCheck.isObject(o2)) return false
                // 深度拷贝，如果冲突则尽可能合并子对象，如果实在不可合并，则后面的替代前面的
                deepCopy = function(target, copy) {
                    var key, _target, _copy
                    for (key in copy) {
                        _target = target[key]
                        _copy = copy[key]
                        if (typeCheck.isObject(_target) && typeCheck.isObject(_copy)) {
                            deepCopy(_target, _copy)
                        } else {
                            target[key] = _copy
                        }
                    }
                    return target
                }
                return deepCopy(o1, o2)
            }
            result = [o1]
            return result.concat(o2)
        },
        // 这个方法会遍历对象或者数组，并调用函数 fn
        // 当队列中任何一个函数返回 false 时，将会终止
        each: function(o, fn) {
            var len, i
            if (typeCheck.isArrayLike(o)) {
                len = o.length
                for (i = 0; i < len; ++i) {
                    if (fn.call(o[i], i, o[i]) === false) break
                }
            } else {
                for (i in o) {
                    if (fn.call(o[i], i, o[i]) === false) break
                }
            }
            return o
        },
        // 这里与 each 用法类似，不过是会提供需要的所有参数
        // 这样就不使用 call 方式调用函数了，并且将所有不为空的值返回成数组
        // 这里需要注意的是如果单项返回了数组，就会将数组拆分，形成漫射
        // 所以可能会有重复
        map: function(o, fn, arg) {
            var res = [],
                len, i, value
            if (typeCheck.isArrayLike(o)) {
                len = o.length
                for (i = 0; i < len; ++i) {
                    value = fn.call(o[i], o[i], arg)
                    if (typeCheck.isSet(value)) res.push(value)
                }
            } else {
                for (i in o) {
                    value = fn.call(o[i], o[i], arg)
                    if (typeCheck.isSet(value)) res.push(value)
                }
            }
            return ARRAY_PROTOTYPE.concat.apply([], res)
        },
        // 返回前面的字符在后面字符串的位置
        // 如果有 i 参数，则从第 i 位开始查找
        // 如果不存在，则返回 -1
        inString: function(cell, compare, i) {
            return compare.indexOf(cell, i) 
        },
        // 判断一个字符是否在后面的字符串中
        strstr: function(cell, compare) {
            return tool.inString(cell, compare) !== -1
        },
        // 返回一个元素在数组中的位置
        // 如果有 i 参数，则从第 i 个开始查找
        // 返回在数组中的位置，如果没有，则为 -1
        // 这里不直接用原生 indexOf 是因为在小量数据下表现没有循环好
        // 并且我们可能需要比较例如 [1,2] 在不在 [[1,2], [2,3]] 的情况
        // http://jsperf.com/thor-indexof-vs-for/5
        inArray: function(item, arr, i) {
            var len = arr.length
            // i 参数可以为负数表示从倒数第几个开始
            i = i ? i < 0 ? Math.max(0, len + i) : i : 0
            for (; i < len; ++i) {
                // 使用 i in arr 的原因是如果比较 undefined 在不在数组内
                // 就必须要保证不是稀疏数组, 那个键是存在的
                if (i in arr && tool.equal(arr[i], item)) return i
            }
            return -1
        },
        arrarr: function(item, arr) {
            return tool.inArray(item, arr) !== -1
        },
        // 这个方法用于数组排序之后去重
        // fn 传入了排序时的比较函数
        uniqueSort: function(o, fn) {
            var res = [],
                len, i
            if (!typeCheck.isArray(o)) return false
            o = tool.clone(o).sort(fn)
            for (i = 0, len = o.length; i < len; ++i) {
                if (o[i] !== o[i + 1]) {
                    res.push(o[i])
                }
            }
            return res
        },
        // 这个方法用于数组乱序，实现原理是随机挑选重列数组
        shuffle: function(o) {
            var len, i, seed, t
            if (!typeCheck.isArray(o)) return false
            len = o.length
            i = len
            while (--i) {
                seed = ~~(Math.random() * (i + 1))
                if (seed !== i) {
                    t = o[seed]
                    o[seed] = o[i]
                    o[i] = t
                }
            }
            return o
        },
        // 这个方法用于提取对象中的值(抛弃key)变成数组，可以接收dom节点对象
        values: function(o) {
            var oType = typeCheck.type(o),
                result = [],
                key
            if (!typeCheck.isObject(o)) return false
            // 这里对节点类型对象做了处理，变成可操作的数组类型
            if (oType === 'nodeList' || tool.strstr('html', oType)) {
                return Array.prototype.slice.call(o, 0)
            }
            // 这里做了引用分离，防止污染
            o = tool.clone(o)
            for (key in o) {
                result.push(o[key])
            }
            return result
        },
        // 这个方法用于提取对象中的键变成数组
        keys: function(o) {
            var result = [],
                key
            if (!typeCheck.isObject(o)) return false
            for (key in o) {
                result.push(key)
            }
            return result
        },
        // 获取时间戳方法
        // 例如 getTime('2016-1-1 19:00:00', '+1 Day')，表示 2016-1-2 19:00:00 的时间戳
        getTime: function(date, diff) {
            var dateCut, mult, sign, len
            // 处理基础时间
            // 这里如果遇到日期型先转成数字，如果是字符形式就进行替换
            // Date可以分析的字符串形式类似于 2016/1/5 10:00:00
            if (typeCheck.isUndefined(date)) return +new Date
            if (date === 'now') date = +new Date
            if (typeCheck.isNumber(+date)) {
                date = +date
            } else {
                date = (date + '').replace(DATE_EXCHANGE_REG, '/').replace(DATE_CLEAR_REG, '')
                // 这里要用今年数据自动补全
                // 例如 4/21 => 2016/4/21
                len = 3 - date.split('/').length
                date = (len ? formatDate(+new Date, 'Y/m/d '.substring(0, 2 * len)) : '') + date
                date = +new Date(date)
            }
            // 处理与基础时间的差距
            if (typeCheck.isString(diff) && diff !== '') {
                dateCut = diff.match(TIMEDIFF_REG) || []
                mult = +dateCut[1]
                sign = dateCut[2]
                if (typeCheck.isNumber(mult) && typeCheck.isSet(sign)) {
                    diff = mult * (TIME_EXCHANGE[sign.substring(0, 1).toUpperCase()] || 1E3)
                } else {
                    // 这里的情况是传了数字形式的字符串
                    if (typeCheck.isNumber(+diff)) {
                        diff = +diff
                    } else {
                        diff = 0
                    }
                }
            // 如果不是字符串或者数字，那么置为0
            } else if (!typeCheck.isNumber(diff)) {
                diff = 0
            }
            return date + diff
        },
        // 获得当前时间戳
        now: function() {
            return +new Date
        },
        // 格式化输出字符串日期数据
        // format的基本格式为 yyyy-mm-dd hh:ii:ss（不区分大小写）
        // y(年) m(月) d(日) h(时) i(分) s(秒) 中间的连接符可以随便替换
        // 这里需要注意的是 代表时间的变量只会被识别一次
        formatDate: function(date, format, diff) {
            var time = new Date(getTime(date, diff)),
                format = format || 'yyyy-mm-dd hh:ii:ss',
                timeGetFn = TIME_GET_FUNCTION,
                key

            for (key in timeGetFn) {
                if (new RegExp('(' + key + '+)', 'i').test(format)) {
                    var target = RegExp.$1,
                        len = target.length,
                        transKey = key.toUpperCase(),
                        value = timeGetFn[transKey](time) + '',
                        nowLenDiff = len - value.length
                    // 这里处理当'年'的时候，可以截断2位以上的年份
                    // 例如 2015 年 当 yy 的时候返回15
                    // 但是要注意当处理不能截断的时间还是返回原值
                    // 例如 19:08:10 用 h时i分s秒 的时候返回 19时8分10秒
                    value = nowLenDiff < 0 &&
                            len >= 2       &&
                            transKey === 'Y' ? value.substr(-len, len) : value
                    format = format.replace(target, nowLenDiff > 0 ? new Array(nowLenDiff + 1).join('0') + value : value)
                }
            }
            return format
        },
        // 获得当前时间的格式化形式
        date: function(format) {
            return tool.formatDate(+new Date, format)
        },
        // 这个方法用来全局运行一段像是代码的字符串
        globalEval: function(s) {
            // 低版本浏览器存在 window.execScript
            return s && tool.trim(s) && (function(s) {
                // 在chrome一些旧版本里 eval.call(window, data) 无效
                return window['eval'].call(window, s)
            })(s)
        },
        // 这个方法用来运行 {{}} 包裹的字符串，并替换返回新字符串
        // data 用来提供替换的变量，提供的变量包裹在函数中，不会污染全局变量
        run: function(s, data) {
            return (s + '').replace(RUNNING_REG, function(s) {
                var code = 'return ' + s.substring(2, s.length - 2),
                    varString = 'var ',
                    name, value
                if (typeCheck.isObject(data)) {
                    for (name in data) {
                        value = data[name]
                        type = typeCheck.type(value)
                        varString += name + '='
                                    + (type === 'object' ? Vessel.lang.JSON.encode(value)
                                    :  type === 'string' ?  '"' + value + '"' : value)
                                    + ','
                    }
                    code = varString.substring(0, varString.length - 1) + ';' + code
                }
                code = '(function(){' + code + '})()'
                return globalEval(code)
            })
        }
    }

    Vessel.extend('lang', typeCheck).extend('lang', tool)
    // 之后可以使用 Vessel.lang.union(window, Vessel.xxx) 将xxx提供的方法扩展至全局
    // 但是不推荐这么使用，会污染 window 或被其他变量污染
}()