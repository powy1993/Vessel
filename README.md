# Vessel

    还没有写完！还在努力中！
    快乐学习，快来工作，快来生活！

目前进度：

### lang.js

- **type** 返回数据类型
        example:
            V.lang.type('a') => string
            V.lang.type(233) => number
            V.lang.type(null) => null
            V.lang.type(function(){}) => function
            V.lang.type(document.body) => htmlbodyelement

- **isUndefined** 是否是未定义数据
        example:
            V.lang.isUndefined(undefined) => true
            V.lang.isUndefined(null) => false

- **isNull** 数据内容是否是Null
        example:
            V.lang.isUndefined(null) => true
            V.lang.isUndefined(undefined) => false

- **isBoolean** 数据内容是否是布尔型
        example:
            V.lang.isBoolean(true) => true
            V.lang.isBoolean(false) => true
             V.lang.isBoolean(null) => false

- **isNumber** 数据内容是否是数值型
        example:
            V.lang.isNumber(1) => true
            V.lang.isNumbe(1/0) => false
            V.lang.isNumbe(NaN) => false

- **isString** 数据内容是否是字符型

- **isDate** 数据内容是否是日期型

- **isArray** 数据是否是数组

- **isArrayLike** 数据是否是类数组对象
        example:
            var a = {
                    0: 'content',
                    length: 1
                }
            V.lang.isArrayLike(a) => true
            V.lang.isArrayLike([]) => true
            delete a.length
            V.lang.isArrayLike(a) => false

- **isFunction** 数据是否是函数

- **isObject** 数据是否是对象
        example:
            V.lang.isObject({}) => true
            V.lang.isObject([]) => false
            V.lang.isObject(document.body) => false

- **isset** 数据内容是否被设置了
        example:
            var a = {}
            V.lang.isset(a) => true
            V.lang.isset(a.b) => false

- **empty** 数据内容是否为空
        example:
            V.lang.empty({}) => true
            V.lang.empty({a:1}) => false
            V.lang.empty([]) => true
            V.lang.empty('') => true
            V.lang.empty(null) => true
            V.lang.empty(false) => true

- **hasOwnProperty** 属性是否来源于对象本身，而不是通过原型继承的
        example:
            var a = {
                    test: '1'
                }
            V.lang.hasOwnProperty(a, 'test') => true

- **trim** 去除字符串两边的空白符
        example:
            var a = '   test   '
            V.lang.trim(a) => 'test'

- **camelCase** 字符串转化成驼峰形式
        example:
            var a = 'webkit-transform'
            V.lang.camelCase(a) => webkitTransform

## 编辑中
