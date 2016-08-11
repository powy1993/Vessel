/**
 * browser.js
 * 提供一些浏览器信息或者页面的基本信息
 * rely: Vessel.js, lang.js
 * owner: rusherwang
 * create: 2016-3-3
 */
!function(window) {
    var docEle = document.documentElement,
        lang = Vessel.lang,
        browser = {}

    // 检测浏览器版本
    browser.ua = function() {
        var userAgent = navigator.userAgent,
            o = {},
            t

        // 下面是取 webkit 版本
        o.webkit = 0
        // 使用 KHTML 的是 基于 webkit 的 Safari 或者 安卓浏览器
        if (lang.strstr('KHTML', userAgent)) {
            o.webkit = 1
        }

        // 可能会遇到 AppleWebkit 或者 AppleWebKit 等多种情况 所以忽略了大小写
        // 这里取的是 webkit 内核的版本
        t = userAgent.match(/AppleWebkit\/([\d\.]*)/i)
        if (t && t[1]) {
            // 这里可能会丢弃到版本数据，例如 601.1.46 只会剩下 601.1
            // 但是为了使用者比较大小的时候不出错，转成了浮点数
            o.webkit = parseFloat(t[1])
        }

        if (!o.webkit) {
            t = userAgent.match(/MSIE\s([^;]*)/)
            if (t && t[1]) {
                o.ie = parseFloat(t[1])
            } else {
                // 因为 IE 和 chrome 等都会添加 like Gecko
                // 所以要判断 Gecko/xxx 才能确定是 Firefox 或者其他只基于 Gecko 的
                t = userAgent.match(/Gecko\/\d*/)
                if (t) {
                    o.gecko = 1
                    // 这里取的是 Gecko 内核版本
                    t = userAgent.match(/rv:([^\s\)]*)/)
                    if (t && t[1]) {
                        o.gecko = parseFloat(t[1])
                    }
                }
            }
        }

        // 检测移动设备
        if (lang.strstr(' Mobile', userAgent)) {
            o.mobile = 'unknown mobile device'
            // 是否是 iPhone, iPod 或者 iPad
            t = userAgent.match(/iPhone|iPod|iPad/)
            if (t) {
                o.mobile = t[0]
            } else {
                // 是否是安卓设备 并且是 什么版本
                t = userAgent.match(/Android ([\d\.]*)/)
                if (t && t[1]) {
                    o.mobile = 'Android'
                    o.android = t[1]
                }
            }
        }

        // 检测一些浏览器
        t = userAgent.match(/QQBrowser|Firefox|Chrome|MicroMessenger|Maxthon|UCWEB|360SE/)
        o.software = t ? t[0] : 'Native'

        return o
    }()

    // 检测css前缀
    browser.cssCore = function(testStyle) {
        switch (true) {
            case testStyle.webkitTransition === '':
                return 'webkit'
            case testStyle.MozTransition === '':
                return 'Moz'
            case testStyle.msTransition === '':
                return 'ms'
            default:
                return ''
        }
    }(document.createElement('Vessel').style)

    // 获取浏览器可视宽度
    browser.getWidth = function() {
        return docEle.clientWidth || window.innerWidth
    }

    // 获取浏览器可视高度
    browser.getHeight = function() {
        return docEle.clientHeight || window.innerHeight
    }

    // 不同浏览器特性检测或者漏洞检测
    // 这里还需要不断补充完善
    browser.support = (function(support) {
        var div = document.createElement('div'),
            select = document.createElement('select'),
            option = select.appendChild(document.createElement('option')),
            input, a

        // 初始化
        div.setAttribute('className', 'Vessel')
        div.innerHTML = ' <link /><table></table><a href="link">a</a><input type="checkbox"/>'
        a = div.getElementsByTagName('a')[0]
        a.style.cssText = 'top:1px;float:left;opacity:.5'
        input = div.getElementsByTagName('input')[0]

        support.getSetAttribute = div.className !== 'Vessel'

        // 确定 opacity 属性是否存在，IE678 是通过 filter 滤镜来支持透明度
        support.opacity = /^0.5/.test(a.style.opacity)

        return support
    })({})
    
    Vessel.extend('browser', browser)
}(window)