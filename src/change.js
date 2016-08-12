/**
 * change.js(#include css.js, animation.js)
 * 让元素可以进行一些位置颜色透明度等变化的动态类
 * rely: Vessel.js, lang.js, browser.js, JSON.js
 * owner: rusherwang
 * create: 2016-1-21
 */
!function(window) {
    var lang = Vessel.lang,
        support = Vessel.browser.support,
        cssCore = Vessel.browser.cssCore,
        // 目前，这些属性是没有单位的
        cssOnlyNumber = {
            columnCount: true,
            fillOpacity: true,
            fontWeight: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            widows: true,
            zIndex: true,
            zoom: true
        },
        // 需要运算输入值的情况
        needRunReg = /{{.*}}/,
        cssKeyFix,
        getStyles, curCSS,           // 获取样式相关
        devideStyle,                 // 获取单位相关
        cssHooks,                    // 样式钩子
        css,                         // 样式属性的入口
        animate,                     // 动画入口
        Tween, TweenProto,           // 动画队列相关
        line, interval, lineRun      // 队列执行相关

    cssHooks = {
        // 无需兼容的情况
        'default': {
            get: function(elem, key) {
                var style = curCSS(elem, key)
                return style ? style : elem.style[key]
            },
            set: function(elem, key, value) {
                elem.style[key] = value
                return
            }
        }
    }

    if (!support.opacity) {
        // 透明度钩子
        var opacityReg = /opacity\s*=\s*([^)]*)/,
            alphaReg = /alpha\([^)]*\)/i

        cssHooks.opacity = {
            get: function(elem, key) {
                // 这里解析了 filter: alpha(opacity=xx) 的情况
                return opacityReg.test(elem.currentStyle ? elem.currentStyle.filter : elem.style.filter || '') ? (.01 * parseFloat(RegExp.$1)) + '' : '1'
            },
            set: function(elem, key, value) {
                var style = elem.style,
                    currentStyle = elem.currentStyle,
                    filter = currentStyle && currentStyle.filter || style.filter || '',
                    opacity = 'alpha(opacity=' + value * 100 + ')'

                // IE 里面如果不是一个块级上下文，透明度可能失效
                style['zoom'] = 1

                // 这里我们发现透明度为 1 的时候其实没必要保留滤镜这个属性(如果没有其他滤镜效果)
                // 这样可以节约重绘时候的性能
                if ((value >= 1 || value === '') &&
                    lang.trim(filter.replace(alphaReg, '')) === '' &&
                    style.removeAttribute) {
                    style.removeAttribute('filter')
                    // 如果没有内联的透明度或者没有另外的滤镜了，这次操作就结束了
                    if (value === '' || currentStyle && !currentStyle.filter) {
                        return
                    }
                }
                // 这里要保留原本的滤镜 再加上透明度这一项
                style.filter = alphaReg.test(filter) ? filter.replace(alphaReg, opacity) : filter + ' ' + opacity;
                return
            }
        }
    }

    lang.each(['width', 'height'], function(i, key) {
        // 宽度和高度钩子
        cssHooks[key] = {
            get: function(elem, key) {
                var value = key === 'width' ? elem.offsetWidth : elem.offsetHeight
                if (value <= 0 || !lang.isSet(value)) {
                    value = curCSS(elem, key)
                }
                return value + 'px'
            },
            set: function(elem, key, value) {
                elem.style[key] = value === '' ? 'auto' : value
                return
            }
        }
        // 扩展 width, height 方法
        Vessel.fn[key] = function(value) {
            value = parseFloat(value);
            if (lang.isNumber(value)) {
                value = value < 0 ? 0 : value
                return css.call(this, key, value)
            } else {
                return parseFloat(css.call(this, key))
            }
        }
    })

    // 对传入的 css 键做一些操作
    // 主要是加前缀或者变成驼峰形式
    if (cssCore === '') {
        cssKeyFix = function(key) {
            return lang.camelCase(key)
        }
    } else {
        var needPrefix = /(transform|transition)/i,
            hasPrefix = /webkit|moz|ms/gi
        cssKeyFix = function(key) {
            // 修复前缀的目的是有些浏览器可能只支持增加前缀的方式设置 CSS3 属性
            // 这种情况在 IE9 或者 MAC 上的 Safari 上可能发生
            if (needPrefix.test(key) && !hasPrefix.test(key)) {
                key = cssCore + '-' + key
            }
            return lang.camelCase(key)
        }
    }

    // 获取计算后的CSS样式
    if (window.getComputedStyle) {
        // 这里是标准浏览器的获取方式
        getStyles = function(elem) {
            return window.getComputedStyle(elem, null)
        }
        curCSS = function(elem, key) {
            var computed = getStyles(elem)
            return computed ? computed.getPropertyValue(key) || computed[key] : undefined
        }
    } else if (document.documentElement.currentStyle) {
        // 这里是 IE9- 或者 其他非标准浏览器 的获取方式
        var positionReg = /^(top|right|bottom|left)$/,
            // 匹配数字的正则
            numberReg = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/,
            // 匹配不是 px 单位的正则 例如 1.2em
            numberNoPxReg = new RegExp('^(' + numberReg.source + ')(?!px)[a-z%]+$', 'i')

        getStyles = function(elem) {
            return elem.currentStyle
        }
        curCSS = function(elem, key) {
            var computed = getStyles(elem),
                res = computed ? computed[key] : undefined,
                style = elem.style,
                left, rs, rsLeft
            // 当获取不到计算后的样式内容时
            // 我们需要从 style 里面获取一份，这样可以避免返回空
            // 虽然这个样式可能并没有很好地生效
            if (res == null && style && style[key]) {
                res = style[key]
            }
            // 如果返回的结果里面单位存在 em 或者 % 等，就需要转化一下
            // 这里是写入 left 并且返回正确值的方式
            if (numberNoPxReg.test(res) && !positionReg.test(key)) {
                // 获得旧数据
                left = style.left
                // 虽然 FireFox 没有 runtimeStyle, 但是这里仅仅针对低版本 IE
                rs = elem.runtimeStyle
                rsLeft = rs && rs.left
                // 新值放入 让 computed 计算出来的值正确
                if (rsLeft) {
                    rs.left = elem.currentStyle.left
                }
                style.left = key === 'fontSize' ? '1em' : res
                res = style.pixelLeft + 'px'

                // 数据重置
                style.left = left
                if (rsLeft) {
                    rs.left = rsLeft
                }
            }
            return res === '' ? 'auto' : res
        }
    }

    // 这个方法用来将 可变数字 与其他内容分离
    // 例如 'rgb(0, 0, 0)'' => ['rgb(', [0, 0, 0], ')']
    devideStyle = function(s1, s2) {
        var devideReg = /\(?((?:[+-]?(?:\d*\.|)\d+(,\s?)?)+)\)?/,
            devide = function(s) {
                var t = devideReg.test(s),
                    res
                if (t) {
                    res = s.split(RegExp.$1)
                    res.push(RegExp.$1.replace(/\s/g, '').split(','))
                } else {
                    res = ['', '', s]
                }
                return res
            },
            intval = function(o) {
                return lang.map(o, function() {
                    return !this ? 0 : parseFloat(this)
                })
            },
            d1 = devide(s1 + ''),
            d2 = devide(s2 + ''),
            u1, u2
        // 当两个可变数字和单位都相同时，这次的动画不必进行
        if (lang.equal(d1, d2)) return false
        // 当不符合格式要求的时候，这次动画不必进行
        if (d1.length !== 3 || d2.length !== 3) return false
        u1 = d1.slice(0, 2)
        u2 = d2.slice(0, 2)
        // 如果起始帧和结束帧可以被过渡，就返回拼装前后字符串
        // 之后将起始和结束的帧按数值传回，方便运算
        // 例如 设置 width: 70 就返回 [['', 'px'], [0], [70]]
        if (lang.equal(u1, u2)) return [u1, intval(d1[2]), intval(d2[2])]
        // 当初始值为空不能被解析的时候，尝试使用结束值的前后字符串，并且将初始值设置为 0
        if (lang.equal(u1, ['', ''])) {
            d1[2] = (new Array(d2[2].length + 1)).join('0').split('')
            return [u2, intval(d1[2]), intval(d2[2])]
        }
        return false
    }

    css = function(key, value) {
        var needRun = false
        if (!lang.isString(key)) return

        key = cssKeyFix(key)
        if (!lang.isSet(value)) {
            // 如果没有 value 那就是需要进行获取
            // 这里使用了钩子的方式获取兼容，可以让兼容代码和操作代码分离
            // 利于后期的维护
            return (cssHooks[key] && cssHooks[key].get ? cssHooks[key] : cssHooks['default']).get(this[0], key)
        } else {
            if (needRunReg.test(value)) {
                needRun = true
            } else {
                if (!lang.isEmpty(value) && lang.isNumber(+value)) {
                    value += cssOnlyNumber[key] ? '' : 'px'
                }
            }
            lang.each(this, function() {
                // 如果遇到 {{now - xx}} 的情况需要进行运算
                var hook = cssHooks[key],
                    calcValue = value
                if (needRun) {
                    calcValue = lang.run(calcValue, {
                        now: (hook && hook.get ? hook : cssHooks['default']).get(this, key)
                    })
                    if (!lang.isEmpty(value) && lang.isNumber(+calcValue)) {
                        calcValue += cssOnlyNumber[key] ? '' : 'px'
                    }
                }
                (hook && hook.set ? hook : cssHooks['default']).set(this, key, calcValue)
            })
            return this
        }
    }

    // 动画队列
    Tween = function(elem, prop, end, duration, easing) {
        return new Tween.prototype.init(elem, prop, end, duration, easing)
    }

    TweenProto = Tween.prototype = {
        constructor: Tween,
        init: function(elem, prop, end, duration, easing) {
            var vElem = Vessel(elem),
                start = vElem.css(prop),
                devide
            this.elem = elem
            this.prop = prop
            this.start = start === 'auto' ? '0px' : start

            // 这里是用测试法得出动画之后结果会变成什么数值
            vElem.css(prop, end)
            this.end = vElem.css(prop)
            vElem.css(prop, start)

            devide = devideStyle(this.start, this.end)
            if (devide === false) {
                if (typeof console === 'object') {
                    console.warn('Set\n')
                    console.warn(elem)
                    console.warn('CSS style "' + prop + '" to "' + end + '" failed so that animate won\'t effect.')
                }
                return this.cancel = true
            } else {
                // 拼接前后的内容
                this.leftSide = devide[0][0]
                this.rightSide = devide[0][1]
                // 以数组方式提供起始和结束
                // 当他们的长度大于1时，在计算完成之后会用逗号相隔
                this.start = devide[1]
                this.end = devide[2]
            }

            this.duration = duration

            this.easing = lang.isFunction(easing) ? 
                            easing :
                            Vessel.easing[easing]
            this.easing = !this.easing ? Vessel.easing['default'] : this.easing

            this.startTime = lang.now()
        },
        run: function(index) {
            var now = +new Date,
                rate = (now - this.startTime) / this.duration,
                len = this.start.length,
                calcValue = [],
                from, to

            if (rate >= 1) {
                line.splice(index, 1)
                rate = 1
            } else {
                rate = this.easing(rate)
            }

            while (len--) {
                from = this.start[len]
                to = this.end[len]
                calcValue[len] = (to - from) * rate + from
            }
            Vessel(this.elem).css(
                this.prop,
                this.leftSide + calcValue.join(',') + this.rightSide
            )
        }
    }
    TweenProto.init.prototype = TweenProto

    line = []
    lineRun = function() {
        var len = line.length
        while (len--) line[len].run(len)
        if (line.length === 0) {
            clearInterval(interval)
            interval = null
        }
    }
    animate = function(prop, end, duration, easing) {
        return this.each(function() {
            // 将动画加入队列中
            t = Tween(this, prop, end, duration, easing)
            if (!t.cancel) {
                line.push(t)
                if (!interval) {
                    interval = setInterval(lineRun, 13)
                }
            }
        })
    }

    Vessel.fn.extend('css', css).extend('animate', animate)
}(window)