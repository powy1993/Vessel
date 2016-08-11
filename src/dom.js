
/*
 * dom.js 还在努力完善中
 */

/**
 * 选择器扩展(元素选择)
 * rely: Vessel.js, lang.js
 * owner: rusherwang
 * create: 2016-3-7
 */
!function() {
    var lang = Vessel.lang,
        unique = Vessel.unique,
        proto = Vessel.prototype,
        needReverse = /^(?:parents|prevAll)$/,
        withoutUnique = {
            prev: true,
            next: true,
            children: true
        },
        // 过滤器，能够把 o 中符合 selector 的元素选择或者剔除(not)
        filter = function(o, selector, not) {
            var compare = sizzle(selector),
                res = [],
                inGroup
            lang.each(o, function() {
                inGroup = lang.arrarr(this, compare)
                if (inGroup && !not || !inGroup && not) {
                    res.push(this)
                }
            })
            return lang.merge(this.constructor(), res)
        },
        // 将类数组对象转化成数组
        makeArray = function(o) {
            var res = [],
                len = o.length
            while (len--) {
                res[len] = o[len]
            }
            return res
        },
        sizzle = function(selector, context) {
            // 如果选择字符串不是字符串，就转成字符串
            // 如果上下文指定不正确，就设置成 document
            return Vessel.sizzle(selector + '', context && context.nodeType ? (context || context.ownerDocument) : document)
        },
        init

    // Vessel() 的入口
    init = proto.init = function(selector, context) {
        var first, second
        if (lang.isString(selector)){
            // 这边是 Vessel(selector, context) 的情况
            first = this
            first.selector = selector
            second = sizzle(selector, context)
        } else if (lang.isArray(selector) ||
            lang.isObject(selector) &&
            lang.isArrayLike(selector)) {
            // 这边是处理 Vessel(Vessel 对象或者 nodeList) 的情况
            first = this.constructor()
            second = selector
        } else if (selector && selector.nodeType) {
            // 这边是处理 Vessel(DOMNode) 的情况
            this[0] = selector
            this.length = 1
            return this
        } else if (lang.isFunction(selector)) {
            // 这边是处理 Vessel(fn) 的情况
            context = context || window
            return selector.call(context)
        } else {
            return
        }
        return lang.merge(first, second)
    }
    init.prototype = Vessel.fn

    proto.each = function(fn) {
        lang.each(this, fn)
        return this
    }

    // 查找现有DOM集中子元素符合 selector 的
    proto.find = function(selector) {
        var res = []
        // 这里将原来的每一项分别通过 selector 查找下属元素
        // 注意这里是可能会有重复的
        window.sizzle = sizzle
        lang.each(this, function() {
            lang.each(sizzle(selector, this), function() {
                res.push(this)
            })
        })
        // 生成新的 Vessel 对象并且将去重后的节点并入
        res = lang.merge(this.constructor(), unique(res));
        if (this.selector) {
            res.selector = this.selector + ' ' + selector
        }
        return res
    }

    // 查找现有DOM集中元素符合 selector 的
    proto.is = function(selector) {
        return filter.call(this, this, selector, false)
    }

    // 剔除现有DOM集中元素符合 selector 的
    proto.not = function(selector) {
        return filter.call(this, this, selector, true)
    }

    // 通过查找符合 selector 的增加节点
    proto.add = function(selector, context) {
        var elem = lang.isString(selector) ? sizzle(selector, context) : selector
        return lang.merge(this.constructor(), unique(makeArray(lang.merge(this, elem))))
    }

    // 筛选出从第 n 个开始, 第 m 个结束(不包括m)这些节点
    proto.slice = function(n, m) {
        return lang.merge(this.constructor(), [].slice.call(this, n, m))
    }

    // 筛选出第 n 个节点
    proto.eq = function(n) {
        return this.slice(n, n + 1)
    }
    // 第一个节点
    proto.first = function(n) {
        return this.eq(0)
    }
    // 最后一个节点
    proto.last = function() {
        return this.eq(this.length - 1)
    }

    var direct = function(elem, dir) {
        // 这个方法用来查找不同辈的元素
            var res = []
            // nodeType 等于 9 为根元素
            while ((elem = elem[dir]) && elem.nodeType !== 9) {
                // nodeType 等于 1 为正常节点
                if (elem.nodeType === 1) {
                    res.push(elem)
                }
            }
            return res
        },
        // 取第一个符合的元素
        sibling = function(elem, dir) {
            do {
                elem = elem[dir]
            } while (elem && elem.nodeType !== 1)
            return elem
        },
        // 这个方法用来查找同辈的元素
        siblings = function(elem, self) {
            var res = []
            for (; elem; elem = elem.nextSibling) {
                // 这里要排除掉本身
                if (elem.nodeType === 1 && elem !== self) {
                    res.push(elem)
                }
            }
            return res
        }
    // 限制查找类型的一些方法
    lang.each({
        parent: function(elem) {
            var parent = elem.parentNode
            return parent && parent.nodeType !== 11 ? parent : null
        },
        parents: function(elem) {
            return direct(elem, 'parentNode')
        },
        prev: function(elem) {
            return sibling(elem, 'previousSibling')
        },
        prevAll: function(elem) {
            return direct(elem, 'previousSibling')
        },
        next: function(elem) {
            return sibling(elem, 'nextSibling')
        },
        nextAll: function(elem) {
            return direct(elem, 'nextSibling')
        },
        siblings: function(elem) {
            // 通过从父节点寻找第一个子节点的后续节点再排除当前节点可以比直接双向查找快
            return siblings((elem.parentNode || {}).firstChild, elem)
        },
        children: function(elem) {
            return siblings(elem.firstChild)
        }
    }, function(name, fn) {
        proto[name] = function(selector) {
            var res = lang.map(this, fn)
            if (lang.isString(selector)) {
                res = filter.call(this, res, selector, false)
            }
            if (res.length > 1) {
                // 除了 prev,next,children 这些不会出现重复以外，其他的都有可能出现重复节点
                // 所以要进行去重 这里的 unique 由 sizzle 提供，主要是进行了节点位置的比较
                if (!withoutUnique[name]) {
                    res = Vessel.unique(makeArray(res))
                }
                // parents 和 prevAll 因为排序之后反序了看起来不爽所以倒置了一下
                if (needReverse.test(name)) {
                    res.reverse()
                }
            }
            return lang.merge(this.constructor(), res)
        }
    })
}()

/**
 * 选择器扩展(元素操作)
 * rely: Vessel.js, lang.js
 * owner: rusherwang
 * create: 2016-3-29
 */
!function() {
    var lang = Vessel.lang,
        proto = Vessel.prototype

    // 遍历每一个元素，并执行 fn 函数
    // fn 可接受两个参数，第一个表示序号，第二个表示这个元素
    // 其中 this 也表示这个元素
    proto.each = function(fn) {
        return lang.each(this, fn)
    }

    // 遍历每一个元素，并执行 fn 函数
    // 最终返回包含所有执行结果的数组
    proto.map = function(fn) {
        return lang.map(this, fn)
    }

    // 获取节点的文本内容(内部函数)
    // 虽然这里可以使用 innerText || textContent 完成
    // 但似乎每个浏览器出来的内容不是那么统一
    // 并且，这里面不会包括 特殊标签的内容，例如 script style 等
    // 为了保证统一性和扩展性，所以自写了一个函数
    var getText = function(node) {
        return node.innerText
    }
    // 获取匹配的元素集合中第一个元素的 文本内容
    // 或设置匹配的元素集合中每个元素的 文本内容
    proto.text = function(value) {
        var node = this[0]
        return lang.isSet(value) ? this.empty().append(
            // 这里创建了一个文本节点，然后用 append 的方式加入
            (node && node.ownerDocument || document).createTextNode(value)
        ) : getText(node)
    }

    // 获取匹配的元素集合中第一个元素的 innerHTML
    // 或设置匹配的元素集合中每个元素的 innerHTML
    proto.html = function(value) {
        var node = this[0]
        // 这里要对 value 进行判断
        return lang.isSet(value) ? this.empty().append(value) : node.innerHTML
    }

    // 当针对 table 元素直接进行添加 tr 时是不正确的
    // 因为 tr 应该被添加在 tbody 上
    // 如果没有正确被添加，那么可能造成 IE8- 发生问题
    // 这里的处理思路是如果没有 tbody，会创建一个 tbody，再在这个 tbody 下添加
    var fixTableTarget = function(parent, child) {
        return lang.tagName(parent, 'table') &&
                lang.tagName(child.nodeType === 1 ? child : child.firstChild, 'tr') ?
                parent.getElementsByTagName('tbody')[0] ||
                parent.appendChild(parent.ownerDocument.createElement("tbody")) :
                parent
    }
    // 在元素末尾增加指定的内容
    proto.append = function(value) {
        if (value.nodeType) {
            if (value.nodeType !== 1 &&      // 元素节点
                value.nodeType !== 3 &&      // 文本节点
                value.nodeType !== 9 &&      // 文档节点
                value.nodeType !== 11) {     // 框架节点
                return this
            }
        } else if (lang.isString(value)){
            // 临时代码
            return this.each(function() {
                var that, temp
                if (lang.tagName(this, 'tbody')) {
                    that = this
                    temp = this.ownerDocument.createElement('div')
                    temp.innerHTML = '<table><tbody>' + value + '</tbody></table>'
                    V(temp.firstChild.firstChild).children().each(function() {
                        that.appendChild(this)
                    })
                } else {
                    fixTableTarget(this, value).innerHTML = value
                }
            })
        }
        return this.each(function() {
            fixTableTarget(this, value).appendChild(value.cloneNode(true))
        })
    }

    // 在元素开头增加指定的内容
    proto.prepend = function() {

    }

    // 在被选元素前插入指定的内容
    proto.before = function() {

    }

    // 在被选元素后插入指定的内容
    proto.after = function() {

    }

    // 移除节点
    // 这里需要注意的是要移除和它相关的任何缓存或者事件
    // 防止出现内存泄漏
    proto.remove = function() {
        // 临时代码
        this.each(function() {
            if (this && this.parentNode) {
                this.parentNode.removeChild(this)
            }
        })
        return
    }

    // 清空子节点
    // 这里需要注意的是要移除和它相关的任何缓存或者事件
    // 防止出现内存泄漏
    proto.empty = function() {
        // 临时代码
        return this.each(function() {
            var doc, parent
            if (lang.tagName(this, 'tbody')) {
                V(this).children().remove()
            } else {
                this.innerHTML = ''
            }
        })
    }

    // 获取当前元素在父元素下的位置
    // 如果有多个元素，那么只取第一个
    proto.index = function() {
        var elem = this[0]
        // 这里的实现方式是取元素前面含有节点的长度
        // 这种实现方式比找到父元素再比较子元素的位置更便捷
        return elem && elem.parentNode ? this.first().prevAll().length : -1
    }

    // 更换子节点的位置
    proto.exchange = function(from, to) {
        return this
    }

    // 检查元素是否有某个类(内部方法)
    var hasClass = function(o, clsName) {
        // 要确定传入的元素是 html节点
        if (o.nodeType !== 1) return false
        // 两边加上空格的原因是这样就可以把 空格+name+空格 当成一个整体判断
        var old = ' ' + o.className + ' '
        clsName = ' ' + lang.trim(clsName) + ' '
        return lang.strstr(clsName, old)
    }
    // 检查元素是否有某个类
    // 如果有很多元素，那么只要其中有一个含有，就返回true
    proto.hasClass = function(value) {
        var len = this.length
        while (len--) {
            if (hasClass(this[len], value)) return true
        }
        return false
    }

    // 如果元素没有某个类，就给它加上某个类
    proto.addClass = function(value) {
        var len = this.length,
            o
        while (len--) {
            o = this[len]
            if (!hasClass(o, value)) {
                o.className = lang.trim(o.className + ' ' + value)
            }
        }
        return this
    }

    // 如果元素有某个类，就给它替换成其他类
    proto.replaceClass = function(value, replace) {
        var len = this.length,
            o, old
        while (len--) {
            o = this[len]
            if (o.nodeType === 1) {
                old = ' ' + o.className + ' '
                value = ' ' + lang.trim(value) + ' '
                replace = replace ? ' ' + lang.trim(replace) + ' ' : ' '
                o.className = lang.trim(old.replace(value, replace))
            }
        }
        return this
    }

    // 如果元素有某个类，就给它去除某个类
    proto.removeClass = function(value) {
        return this.replaceClass(value, '')
    }

    // 如果元素有某个类，就给它去除某个类
    // 如果元素没有某个类，就给它加上某个类
    proto.toggleClass = function(value) {
        return this.each(function() {
            var o = Vessel(this)
            if (o.hasClass(value)) {
                o.removeClass(value)
            } else {
                o.addClass(value)
            }
        })
    }

    // 获取或设置某属性
    proto.attr = function(key, value) {
        // 临时代码
        if (lang.isString(key)) {
            if (lang.isString(value)) {
                return this.each(function() {
                    this.setAttribute(key, value)
                })
            } else {
                return this[0] && this[0].getAttribute(key) || null
            }
        }
        return this
    }

    // 移除某属性
    proto.removeAttr = function(key) {
        // 临时代码
        return this.each(function() {
            this.removeAttribute(key)
        })
    }

    // 获取匹配的元素集合中第一个元素的当前值
    // 或设置匹配的元素集合中每个元素的值
    proto.val = function(value) {
        return lang.isString(value) || lang.isNumber(value) ? this.each(function() {
            this.value = value
        }) : this[0] && this[0].value
    }
}()