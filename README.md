# Vessel
==========

    还没有写完！还在努力中！
    快乐学习，快来工作，快来生活！

==========

### lang.js (基本语言扩展)

- **type** 返回数据类型
``` js
V.lang.type('a')            // string
V.lang.type(233)            // number
V.lang.type(null)           // null
V.lang.type(function(){})   // function
V.lang.type(document.body)  // htmlbodyelement
```

- **isUndefined** 是否是未定义数据
``` js
V.lang.isUndefined(undefined)   // true
V.lang.isUndefined(null)        // false
```

- **isNull** 数据内容是否是Null
``` js
V.lang.isNull(null)         // true
V.lang.isNull(undefined)    // false
```

- **isBoolean** 数据内容是否是布尔型
``` js
V.lang.isBoolean(true)  // true
V.lang.isBoolean(false) // true
V.lang.isBoolean(null)  // false
```

- **isNumber** 数据内容是否是数值型
``` js
V.lang.isNumber(1)   // true
V.lang.isNumber(1/0) // false
V.lang.isNumber(NaN) // false
```

- **isString** 数据内容是否是字符型

- **isDate** 数据内容是否是日期型

- **isArray** 数据是否是数组

- **isArrayLike** 数据是否是类数组对象
``` js
var a = {
        0: 'content',
        length: 1
    }
V.lang.isArrayLike(a)   // true
V.lang.isArrayLike([])  // true
delete a.length
V.lang.isArrayLike(a)   // false
```

- **isFunction** 数据是否是函数

- **isObject** 数据是否是对象
``` js
V.lang.isObject({})             // true
V.lang.isObject([])             // false
V.lang.isObject(document.body)  // false
```

- **isset** 数据内容是否被设置了
``` js
var a = {}
V.lang.isset(a)     // true
V.lang.isset(a.b)   // false
```

- **empty** 数据内容是否为空
``` js
V.lang.empty({})    // true
V.lang.empty({a:1}) // false
V.lang.empty([])    // true
V.lang.empty('')    // true
V.lang.empty(null)  // true
V.lang.empty(false) // true
```

- **hasOwnProperty** 属性是否来源于对象本身，而不是通过原型继承的
``` js
var a = {
        test: '1'
    }
V.lang.hasOwnProperty(a, 'test') // true
```

- **trim** 去除字符串两边的空白符
``` js
var a = '   test   '
V.lang.trim(a) // 'test'
```

- **camelCase** 字符串转化成驼峰形式
``` js
var a = 'webkit-transform'
V.lang.camelCase(a) // webkitTransform
```

- **tagName** 获得节点的标签或者判断标签是否一致
``` js
V.lang.tagName(document.body)           // body
V.lang.tagName(document.body, 'body')   // true
```

- **parse** 适配进制
``` js
V.lang.parse(10, 2)         // 将10进制的10转化成2进制
V.lang.parse('1a', 16, 2)   // 将16进制的1a转化成2进制
```

- **equal** 比较两个数据的内容是否相等
``` js
var a = {
        x: 1
    },
    b = {
        x: 1
    },
    c = function() {
        return 233
    },
    d = function() {
        return 233
    },
    e = '1',
    f = 1
a === b             // false
V.lang.equal(a, b)  // true
c === d             // false
V.lang.equal(c, d)  // true
e === f             // false
V.lang.equal(e, f)  // false
```

- **contain** 比较前面的数据是否包含后面的数据
``` js
var a = [1, 2],
    b = ['a'],
    c = {
        a: 1,
        b: 2
    }
V.lang.contain(a, 1)    // true
V.lang.contain(a, '1')  // false
V.lang.contain(a, 3)    // false
V.lang.contain(c, b)    // true
```

- **clone** 克隆传入元素
``` js
var a, b
a = {
    x: 1
}
b = a
b.x = 2
a.x                         // 2
a = {
    x: 1
}
b = V.lang.clone(a)
b.x = 2
a.x                         // 1
V.lang.clone(document.body) // <body>
```

- **merge** 合并两个类数组对象
``` js
var a = [1],
    b = {0: 1, length: 1},
    c = [2]
V.lang.merge(a, c) // [1, 2]
a                  // [1, 2]
V.lang.merge(b, c) // {0: 1, 1: 2, length: 2}
b                  // {0: 1, 1: 2, length: 2}
```

- **union** 尽可能合并两个对象内容
``` js
var a = {
        x: 1
    },
    b = {
        y: 2
    },
    c = {
        x: 2,
        y: 2
    }
V.lang.union(a, b)              // {x: 1, y: 2}
a                               // {x: 1}
V.lang.union(a, c)              // {x: 2, y: 2}
V.lang.union(window, V.lang)
isset(union)                    // true
union(a, b)                     // {x: 1, y: 2}
```

- **each** 遍历一个对象或者数组
``` js
var a = [1, 2, 3],
    b = {a: 1, b: 2, c: 3}
V.lang.each(a, function(k, v) {
    k       // 0 => 1 => 2
    v       // 1 => 2 => 3
    this    // 1 => 2 => 3
})
V.lang.each(b, function(k, v) {
    k       // 'a' => 'b' => 'c'
    v       // 1 => 2 => 3
    this    // 1 => 2 => 3
})
```

- **map** 遍历一个对象或者数组，把所有结果拼装成数组返回
``` js
var a = [1, 2, 3]
V.lang.map(a, function(v) {
    return v + 1
}) // [2, 3, 4]
V.lang.map(a, function(v) {
    return [v, 5]
}) // [2, 5, 3, 5, 4, 5]
```

- **inString** 返回后面的字符串在前面字符串的位置
``` js
var a = '12342'
V.lang.inString(a, '2')     // 1
V.lang.inString(a, '5')     // -1
// 起始位置从第二个开始
V.lang.inString(a, '2', 2)  // 4
```

- **strstr** 判断一个字符是否在后面的字符串中，如果存在，则返回向后的子串
``` js
var a = '1234'
V.lang.strstr(a, '2')     // 234
V.lang.strstr(a, '5')     // null
```

- **inArray** 返回一个元素在数组中的位置
``` js
var a = [1, 2, 3, 4, 2]
V.lang.inArray(a, 2)     // 1
V.lang.inArray(a, 5)     // -1
// 起始位置从第二个开始
V.lang.inArray(a, 2, 2)  // 4
```

- **arrarr** 判断一个数据是否在后面的数组中，如果存在，则返回向后的子数组
``` js
var a = [1, 2, 3, 4, {}]
V.lang.arrarr(a, 2)     // [2, 3, 4, {}]
V.lang.arrarr(a, 5)     // null
V.lang.arrarr(a, {})    // [{}]
```

- **uniqueSort** 排序并去重
``` js
var a = [1, 6, 5, 1, 2, 3, 3, 4]
V.lang.uniqueSort(a) // [1, 2, 3, 4, 5, 6]
```

- **shuffle** 数组乱序
``` js
var a = [1, 2, 3, 4, 5]
V.lang.shuffle(a)
a // [3, 4, 2, 5, 1]
```

- **values** 提取对象中的值(抛弃key)
- **keys** 提取对象中的键变成数组(抛弃value)
``` js
var a = {x: 1, y: 2}
V.lang.values(a) // [1, 2]
V.lang.keys(a)   // ['x', 'y']
```

- **getTime** 获取时间戳方法
- **now** 获得当前时间戳
``` js
// 获取现在的时间戳
V.lang.now()
V.lang.getTime()
V.lang.getTime('now')
// 获取 今年1月1日晚上7点 的时间戳
V.lang.getTime('1/1 19:00:00')
// 获取 2016年1月1日晚上7点 的时间戳
V.lang.getTime('2016/1/1 19:00:00')
// 获取 从现在开始加一天 的时间戳
V.lang.getTime('now', '+1D')
// 获取 从现在开始减一个月 的时间戳
V.lang.getTime('now', '-1M')
```

- **formatDate** 格式化输出字符串日期数据
- **date** 获得当前时间的格式化数据
``` js
var now = V.lang.now()
// 获得当前时间的格式化数据
V.lang.date('yyyy-mm-dd hh:ii:ss')
V.lang.formatDate(now, 'yyyy-mm-dd hh:ii:ss')
// 获得当前时间加一天的格式化数据
V.lang.formatDate(now, 'yyyy-mm-dd hh:ii:ss', '+1D')
```

- **globalEval** 全局下执行一段像是代码的字符串
``` js
V.lang.globalEval('a = 1; b = a + 1')
b // 2
```

- **run** 这个方法用来运行 {{}} 包裹的字符串，并替换返回新字符串
``` js
V.lang.run('1+2+{{3 + 4}}') // '1+2+7'
V.lang.run('1+2+{{a + b}}', {a: 3, b: 4}) // '1+2+7'
```

### json.js

- **encode** JSON编码
- **decode** JSON解码
``` js
var a = {x: 1, y: 2}
V.lang.JSON.encode(a)       // '{"x":1,"y":2}'
V.lang.JSON.decode('{}')    // Object {}
// 将 lang 里面的方法扩展到全局
V.lang.union(window, V.lang)
JSON.encode(a)              // '{"x":1,"y":2}'
JSON.decode('{}')           // Object {}
```

### cookie.js

- **cookie**
    - **set** 设置cookie
    - **get** 获取cookie
    - **remove** 删除cookie
``` js
// 原方法在 V.util 里面
V.lang.union(window, V.util)
// 以键值对方式获取所有 cookie 中的内容
cookie.get()
// 获取cookie中键为 test 的内容
cookie.get('test')
// 删除cookie中键为 test 的内容
cookie.remove('test')
// 设置cookie，在浏览器关闭后失效
cookie.set('test', 1)
// 设置cookie，并设置失效时长
cookie.set('test', 1, '+1D')        // 一天之后失效
cookie.set('test', 1, '2016/1/1')   // 2016年1月1日失效
// 设置cookie，并设置路径与域名
cookie.set('test', 1, '+1D', '/')               // 将cookie写在根目录下
cookie.set('test', 1, '+1D', 'ac.qq.com/')      // 将cookie写在ac.qq.com下
cookie.set('test', 1, '+1D', 'ac.qq.com/test')  // 将cookie写在ac.qq.com下的test路径
```

### storage.js

- **local** 保存在本地存储中，浏览器关闭不消失
    - **set** 设置
    - **get** 获取
    - **remove** 移除
    - **clear** 清空
- **session** 保存在本地存储中，浏览器关闭就消失
    - **set** 设置
    - **get** 获取
    - **remove** 移除
    - **clear** 清空
``` js
// 原方法在 V.util 里面
V.lang.union(window, V.util)
// 判断当前状态下 local 是否可用
if (V.util.local) {
    // 可用
} else {
    // 兼容方案
}
// 获取local中键为 test 的内容
local.get('test')
// 删除local中键为 test 的内容
local.remove('test')
// 清空保存在local下的所有键值对
local.clear()
// 设置session，在浏览器关闭后失效
session.set('test', 1)
// 设置local，并设置失效时长
local.set('test', 1, '+1D')        // 一天之后失效
local.set('test', 1, '2016/1/1')   // 2016年1月1日失效
```

### connect.js (异步数据获取)

这块内容还在完善，之后会加入缓存机制, load部分还没有写完

- **get** 用 get 方法用服务器获取数据
``` js
V.util.connect.get({
    url: 'ac.qq.com/test.php',
    data: {
        a: 1,
        b: 2
    },
    callback: function(res) {
        console.log(res)
    },
    dataType: 'JSON'
})
```
- **post** 用 post 方法用服务器获取数据
- **load** 从服务器加载一些其他形式的数据

### browser.js (浏览器信息)

- **ua** 浏览器信息
    - **webkit** webkit内核版本信息
    - **ie** ie内核版本
    - **gecko** Gecko内核版本
    - **mobile** 移动设备信息
    - **android** 安卓系统版本
    - **software** 浏览器软件信息
    - **cssCore** 浏览器css特性前缀
    - **getWidth** 获取浏览器可视宽度
    - **getHeight** 获取浏览器可视高度
    - **getUrlParam** 获取链接内参数
```js
// 以 chrome 手机模拟安卓浏览器为例
V.browser.webkit        // 537.36
V.browser.ie            // undefined
V.browser.mobile        // 'Android'
V.browser.android       // '6.0'
V.browser.software      // 'Chrome'
V.browser.cssCore       // 'webkit'
V.browser.getWidth()    // 375
V.browser.getHeight()   // 768
```

### selector.js (选择器)

``` js
// 选择所有标签为 div 的元素
V('div')
// 遍历所有标签为 div 的元素
V('div').each(function() {
    this       // 当前 div
})
// 选择所有标签为 div 的下属元素中含有 test 类的
V('div').find('.test')
// 选择所有标签为 div，并且含有 test 类的
V('div').is('.test')
// 选择所有标签为 div，并且剔除含有 test 类的
V('div').not('.test')
// 选择所有标签为 div 和 文本类型的input
V('div').add('input[type=text]')
// 从第二个开始选择所有标签为 div 的元素
V('div').slice(1)
// 选择前 2-6 个标签为 div 的元素
V('div').slice(1, 6)
// 选择第 n 个标签为 div 的元素
V('div').eq(n)
// 选择第一个标签为 div 的元素
V('div').first()
// 选择最后一个标签为 div 的元素
V('div').last()
// 选择所有标签为 div 的元素的父节点
V('div').parent()
// 选择所有标签为 div 的元素的祖辈节点中含有 test 类的
V('div').parents('test')
// 选择所有标签为 div 的元素的前一个节点
V('div').prev()
// 选择所有标签为 div 的元素前面的所有节点
V('div').prevAll()
// 选择所有标签为 div 的元素的下一个节点
V('div').next()
// 选择所有标签为 div 的元素后面的所有节点
V('div').nextAll()
// 选择所有标签为 div 的所有子节点
V('div').children()
// id 为 test 元素内部的文本内容
V('#test').text()
// 设置 id 为 test 元素内部的文本内容为 test
V('#test').text('test')
// id 为 test 元素内部的 html 内容
V('#test').html()
// 设置 id 为 test 元素内部的 html 内容为 <p>test</p>
V('#test').html('<p>test</p>')
// 在id 为 test 元素末尾增加指定的内容
V('#test').append('<p>test</p>')
// 在id 为 test 元素开头增加指定的内容
V('#test').prepend('<p>test</p>')
// 在id 为 test 元素前插入指定的内容
V('#test').before('<p>test</p>')
// 在id 为 test 元素后插入指定的内容
V('#test').after('<p>test</p>')
// 移除id 为 test 的元素
V('#test').remove()
// 清空id 为 test 的所有子元素
V('#test').empty()
// 获取id 为 test 的元素在父元素下的序号
V('#test').index()
// id 为 test 的元素是否含有 test 类
V('#test').hasClass('test')
// 给id 为 test 的元素添加 test 类
V('#test').addClass('test')
// 给id 为 test 的元素移除 test 类
V('#test').removeClass('test')
// 给id 为 test 的元素替换 test1 类 为 test2
V('#test').replaceClass('test1', 'test2')
// 给id 为 test 的元素不断替换某个类
V('#test').toggleClass('test')
// 获取 id 为 test 的 data-test 属性内容
V('#test').attr('data-test')
// 移除 id 为 test 的 data-test 属性内容
V('#test').removeAttr('data-test')
// 获取 id 为 test 的元素 value 内容
V('#test').val()
// 设置 id 为 test 的元素 value 内容
V('#test').val('test')
```

### promise.js (简易控制数据获取和回调装置)

- **promose** 设置一批键值对数据
- **defer** 异步请求一批键值对数据
- **has** 是否含有某个数据
- **set** 设置某个数据
- **wait** 等待一定毫秒数之后继续执行
- **need** 含有某数据才能继续执行
- **then** 按照顺序执行
- **when** 一旦有某数据就执行
- **reject** 清空所有数据并中止未执行完的步骤
``` js
var user
// 声明 user 的 name 叫 ZhangSan
user = V.util.promise({name: 'ZhangSan'})
// 直接执行
user.then(function(){
    console.log(this.get('name'))
})
// 等待1秒后直接执行
user.wait(1000).then(function(){
    console.log(this.get('name'))
})
// 原本等待1秒后直接执行，中途想要强行继续执行
user.wait(1000).then(function(){
    console.log(this.get('name'))
})
user.forceRun()
// 如果 user 含有内容 address 就执行
// 此时不会执行，因为没有含有 address
user.when('address', function() {
    console.log(this.get('address'))
})
// 执行完设置之后，console被执行
user.set('address', '666')      // 666
// 当数据中 type == 1 的时候就执行 
user.when('type=1', function() {
    console.log(this.get('type'))
})
// 数据来自异步
// 数据获取到之后如果返回内容是 1 则执行之前的when
// 当然，这里后设置 when 也是可以的
user.defer({
    type: ['get', 'ac.qq.com/test', {
        user: this.get('name')
    }]
})
```

### event.js (事件绑定与触发)
    预计 2016-10 之前完成

### change.js (让元素可以进行动态变化)
- **css** 获取或者设置元素的css属性
``` js
// 获取 id 为 test 元素的宽度
V('#test').css('width')
// 设置 id 为 test 元素的宽度为20px
V('#test').css('width', '20px')
```
- **animate** 设置动画
``` js
// 使 id 为 test 元素的背景在1s内渐变至 #333333
V('#test').animate('background-color', '#333333', 1000, 'ease')
// 使 id 为 test 元素的进行平移 x 轴 100px, y 轴 100px
V('#test').css('transform', 'translate(0, 0)') // 初始化
V('#test').animate('transform', 'translate(100px, 100px)', 2000)
// 页面1秒滚动至 2000px，效果为弹跳，结束之后调用回调函数
V(window).animate('scrollTop', '2000px', 1000, 'easeBounceOut', function() {
    console.log('animate end!')
})
// 第四个参数可选函数在 easing.js 中
```
- **stop** 中止动画
``` js
// 中止动画并结束在当前位置
V('#test').stop()
// 中止动画并结束在结尾位置，调用动画结束后的回调函数
V('#test').stop(true)
```

### easing.js (过渡专用的效果函数)
[效果预览](http://1.rushervessel.applinzi.com/demo/easing.html)

- **ease**
- **easeQuadIn**
- **easeQuadOut**
- **easeQuadInOut**
- **easeCubicIn**
- **easeCubicOut**
- **easeCubicInOut**
- **easeSineIn**
- **easeSineOut**
- **easeSineInOut**
- **easeExponentialIn**
- **easeExponentialOut**
- **easeExponentialInOut**
- **easeCircleIn**
- **easeCircleOu**
- **easeCircleInOut**
- **easeBackIn**
- **easeBackOut**
- **easeBackInOut**
- **easeBounceIn**
- **easeBounceOut**
- **easeBounceInOut**
- **easeElasticIn**
- **easeElasticOut**
- **easeElasticInOut**
- **maker** 