# Vessel

    还没有写完！还在努力中！
    快乐学习，快来工作，快来生活！

### lang.js

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
V.lang.isNumber(1)  // true
V.lang.isNumbe(1/0) // false
V.lang.isNumbe(NaN) // false
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

- **contain** 比较前面的数据是否被后面的数据包含
``` js
var a = [1, 2],
    b = ['a'],
    c = {
        a: 1,
        b: 2
    }
V.lang.contain(1, a)    // true
V.lang.contain('1', a)  // false
V.lang.contain(3, a)    // false
V.lang.contain(b, c)    // true
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

- **inString** 返回前面的字符在后面字符串的位置
``` js
var a = '12342'
V.lang.inString('2', a)     // 1
V.lang.inString('5', a)     // -1
// 起始位置从第二个开始
V.lang.inString('2', a, 2)  // 4
```

- **strstr** 判断一个字符是否在后面的字符串中
``` js
var a = '1234'
V.lang.strstr('2', a)     // true
V.lang.strstr('5', a)     // false
```

- **inArray** 返回一个元素在数组中的位置
``` js
var a = [1, 2, 3, 4, 2]
V.lang.inArray(2, a)     // 1
V.lang.inArray(5, a)     // -1
// 起始位置从第二个开始
V.lang.inArray(2, a, 2)  // 4
```

- **arrarr** 判断一个数据是否在后面的数组中
``` js
var a = [1, 2, 3, 4, {}]
V.lang.arrarr(2, a)     // true
V.lang.arrarr(5, a)     // false
V.lang.arrarr({}, a)    // true
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

### storage.js *(一些破旧的浏览器不支持此功能)*

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

### connect.js

这块内容还在完善，之后会加入缓存机制
load部分还没有写完

- **get** 用 get 方法用服务器获取数据
V.util.get({
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
- **post** 用 post 方法用服务器获取数据
- **load** 从服务器加载一些其他形式的数据

### browser.js
