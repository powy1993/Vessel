/**
 * Vessel.js
 * owner: rusherwang
 * create: 2015-12-24
 */
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
				console.warn('Extension has been declared already, you are suggested to change your extension name.(' + extra + ' is not empty)')
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
	var warn = window.console && console.warn || (console = {}, function() {}),
		log = window.console && console.log || (console = {}, function() {})
	console.warn = function() {
		try {
			warn.apply(console, arguments)
		} catch(e) {
			warn(arguments[0])
		}
	}
	console.log = function() {
		try {
			log.apply(console, arguments)
		} catch(e) {
			log(arguments[0])
		}
	}

	window.Vessel = window.V = Vessel
	!window.$ && (window.$ = Vessel)
})(window)

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
			S: 1E3,
			I: 6E4,
			H: 3.6E6,
			D: 8.64E7,
			M: 2.6784E9,
			Y: 3.1536E10
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
		isset: function(o) {
			return o != null
		},
		empty: function(o) {
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
			return !typeCheck.isset(s) ? '' : (s + '').replace(TRIM, '')
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
							if (!typeCheck.isset(o2[o1[i]])) return false
						} else {
							return false
						}
					}
				}
				return true
			} else if (o1Type === 'object') {
				if (o2Type === 'object') {
					for (key in o1) {
						if (!typeCheck.isset(o2[key]) || !tool.contain(o1[key], o2[key])) return false
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
			// 如果某一个不是类数组对象，就退出
			if (!typeCheck.isArrayLike(first) ||
				!typeCheck.isArrayLike(second)) return first
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
					if (typeCheck.isset(value)) res.push(value)
				}
			} else {
				for (i in o) {
					value = fn.call(o[i], o[i], arg)
					if (typeCheck.isset(value)) res.push(value)
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
				date = (len ? tool.formatDate(+new Date, 'Y/m/d '.substring(0, 2 * len)) : '') + date
				date = +new Date(date)
			}
			// 处理与基础时间的差距
			if (typeCheck.isString(diff) && diff !== '') {
				dateCut = diff.match(TIMEDIFF_REG) || []
				mult = +dateCut[1]
				sign = dateCut[2]
				if (typeCheck.isNumber(mult) && typeCheck.isset(sign)) {
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
			var time = new Date(tool.getTime(date, diff)),
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
				return tool.globalEval(code)
			})
		}
	}

	Vessel.extend('lang', typeCheck).extend('lang', tool)
	// 之后可以使用 Vessel.lang.union(window, Vessel.xxx) 将xxx提供的方法扩展至全局
	// 但是不推荐这么使用，会污染 window 或被其他变量污染
}()

/**
 * json.js
 * 提供解析以及将对象 Object 解析为 JSON 的方法
 * 主要参考来源于 http://www.json.org/  json2.js
 * rely: Vessel.js, lang.js
 * owner: rusherwang
 * create: 2016-1-8
 */
!function() {
	var lang = Vessel.lang
		// DANGEROUS_REG 这里面的字符并没有什么意义，转义出来也是空，
		// 过滤掉的原因是有些浏览器在直接解析的时候会转义错误
	var DANGEROUS_REG = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		// ESCAPE_REG 这里面的字符有一定的含义，但会干扰判断，所以要转义成 unicode 字符串，
		// 例如汉字、字母、符号等，注意这里已将 ']' 替换成了 \\u005d
		// 所以后续判断是否合法值的时候可以使用 ']'
		// 使用 ']' 的主要原因是不需要再次过滤数组的结束括号
		ESCAPE_REG = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		// UNICODE_CHANGE_REG 主要用于将 字母、汉字、符号 的 unicode 字符串替换成 '@'
		// 因为这些值都是有意义的，这里替换的是类似 \\u0000 或者 \\b 的值
		UNICODE_CHANGE_REG = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
		// VALUE_CHANGE_REG 主要用于将 字符串空、布尔值、空对象、数字 等替换为 ']'
		// 注意数字可能会有 1E+3(1000) 这种形式
		VALUE_CHANGE_REG = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
		// ARRAY_CHANGE_REG JSON串中可以解析成数组，
		// 所以这里将前一步转化出来的 :[](对象的值是数组) 或者 ^[](数组) 或者 ,[](数组中包含数组)中的 (?)[ 去掉，因为这些是合法的
		ARRAY_CHANGE_REG = /(?:^|:|,)(?:\s*\[)+/g,
		// INVALID_REG 如果验证通过，则这个 JSON串 是可以被直接运行解析的
		INVALID_REG = /^[\],:{}\s]*$/,
		// CHARS 映射和转义公共转义字符以及特殊字符
		// 这些字符虽然匹配 ESCAPE_REG 但不进行 unicode 替换，而是直接映射
		CHARS = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		}

	var _consoleWarn = function(s) {
			return typeof console === 'object' && console.warn(s) || false
		},
		// 将特殊字符进行 unicode 转码使之变成 unicode 字符串 或者 特殊转义字符
		_toUnicode = function(c) {
			return CHARS[c] ? CHARS[c] : '\\u' + ('0000' + (+(c.charCodeAt(0))).toString(16)).slice(-4)
		},
		// 替换过滤某些特殊的空字符，避免在某些浏览器中出现转义错误
		_prepare = function(s) {
			return lang.isString(s) && s.replace(DANGEROUS_REG, _toUnicode)
		},
		// 特殊字符转义成 unicode 字符串
		_escape = function(s) {
			return '"' + s.replace(ESCAPE_REG, _toUnicode) + '"'
		},
		// 检查是否是合法的 JSON 字符串
		_isValid = function(s) {
			s = _prepare(s)
			return s && INVALID_REG.test(s.
						replace(UNICODE_CHANGE_REG, '@').
						replace(VALUE_CHANGE_REG, ']').
						replace(ARRAY_CHANGE_REG, '')
					)
		},
		// 将 JSON 字符串转成 对象
		_makeDecode = function(s, fn) {
			return _isValid(s) ? fn(s)
							   : _consoleWarn('Your param => ' + (lang.type(s) === 'string'
							   ? '\'' + s + '\''
							   : 'type:' + lang.type(s)) + ' <= is not a valid JSON string.')
		},
		// 将 对象 转成 JSON 字符串
		// 这里进行了深度递归的遍历产生字符串
		// Function 类的直接被过滤掉，暂时没有更好的方式
		_makeEncode = function(o) {
			var oType = lang.type(o),
				len,            // 数组情况下用到的变量
				k, v, index,    // 对象情况下用到的变量
				result = []
			switch (oType) {
				case 'string' : return _escape(o)
				case 'number' : return isFinite(o) ? String(o) : 'null'
				case 'boolean':
				case 'null'   : return String(o)
				case 'date'   : return _escape(lang.formatDate(o))
				case 'array'  :
					len = o.length
					while (len--) {
						result[len] = _makeEncode(o[len]) || 'null'
					}
					return '[' + result.join(',') + ']'
				case 'object' :
					index = 0
					for (k in o) {
						// 这里不能包含原型链向上的值
						if (lang.isString(k) && lang.hasOwnProperty(o, k)) {
							v = _makeEncode(o[k])
							if (v) {
								result[index++] = _escape(k) + ':' + v
							}
						}
					}
					// 这里排序是为了让转出来的字符串更美观
					result.sort()
					return '{' + result.join(',') + '}'
				default       : return undefined
			}
		}

	var lang = Vessel.lang,
		json = {
			isValid: _isValid,
			decode: function() {
				// 如果可以使用原生 JSON.parse 的话，使用原生的 parse
				if (lang.isObject(window.JSON) && JSON.parse) {
					return function(s) {
						return _makeDecode(s, JSON.parse)
					}
				} else {
					return function(s) {
						return _makeDecode(s, function(s) {
							return eval('(' + s + ')')
						})
					}
				}
			}(),
			// 这里不使用 JSON.stringify 的原因是它可能无法很好地处理 Date 类
			encode: _makeEncode
		}
	Vessel.extend('lang.JSON', json)
}()

/**
 * cookie.js
 * 读取用户本地cookie以及写入
 * rely: Vessel.js, lang.js, json.js
 * owner: rusherwang
 * create: 2016-1-13
 */
!function() {
	var lang = Vessel.lang,
		dateReg = /[\u5e74\u6708\u65e5\-:\/]/,
		// 分割传入地址，使之变成 domain 和 path 形式
		locationReg = /^(?:http(?:s)?:\/\/)?([^\/]+)?(\/[^\?]+)?/,
		_warn = function(s) {
			console.warn('Cannot set cookie with "' + s + '" because you are located in "' + window.location.href + '"')
		},
		// 创建可以赋值给 document.cookie 的单个cookie键值对
		// expires <Date> cookie的有效期限
		// location <String> cookie存储路径
		// options 里包括了一些cookie的参数包括
		// encode <Boolean> cookie是否进行编码
		// secure <Boolean> 是否是 https 保护 cookie
		_createCookieString = function(key, value, expires, location, options) {
			// 如果键不是字符或者为空 则返回 false
			if (!lang.isString(key) || key === '') return false
			var cookieText = encodeURIComponent(key) + '=',
				locationDevide, domain, path
			if (lang.isObject(options)) {
				// 这里的参数是是否需要对参数进行编码，不编码可能造成无法正常存储
				// 这就要求在读取的时候也需要进行相应的操作
				if (options.encode === false) {
					cookieText += value
				} else {
					cookieText += encodeURIComponent(value)
				}
				// 这里是保护参数设置
				if (options.srcure === true) {
					cookieText += '; secure'
				}
			} else {
				// 默认使用了编码对 value 进行编译
				cookieText += encodeURIComponent(value)
			}
			if (lang.isDate(expires)) {
				// GMT 时间在浏览器调试上看和你理想的时间不符合但是实际上是正确的，因为有时区差
				cookieText += '; expires=' + expires.toGMTString()
			}
			if (lang.isString(location) && location !== '') {
				locationDevide = location.match(locationReg)
				if (lang.isArray(locationDevide)) {
					domain = locationDevide[1]
					path = locationDevide[2]
					// 这里是路径参数设置
					if (lang.isString(domain)) {
						cookieText += '; domain=' + domain
						// 这里要判断域是否是被允许的
						if (!lang.strstr(domain, window.location.hostname)) {
							_warn('domain=' + domain)
							return false
						}
					}
					// 这里是域名参数设置
					if (lang.isString(path)) {
						cookieText += '; path=' + path
						// 这里要判断路径是否是被允许的
						if (!lang.strstr(path, window.location.pathname)) {
							_warn('path=' + path)
							return false
						}
					} else {
						cookieText += '; path=/'
					}
				}
			} else {
				cookieText += '; path=/'
			}
			return cookieText
		},
		_makeCookieValue = function(s) {
			return lang.isString(s) ? s : lang.JSON.encode(s)
		},
		_decodeCookie = function(str, decode) {
			return decode === false ? str : decode === 'JSON' ?
					lang.JSON.decode(decodeURIComponent(str)) :
					decodeURIComponent(str)
		},
		// 取单个 cookie 用正则是最快的
		_getCookie = function(cookie, key, decode) {
			var reg = new RegExp('(?:^|;+|\\s+)' + key + '=([^;]*)'),
				res = cookie.match(reg)
			return res && res[1] ? _decodeCookie(res[1], decode) : ''
		},
		// 这里是将 cookie 所有的键值取出来变成一个对象
		_getAllCookie = function(cookie, decode) {
			var cookieParts = cookie.split(' '),
				len = cookieParts.length,
				cookieKeyAndValue,
				res = {}
			while (len--) {
				cookieKeyAndValue = cookieParts[len].split('=')
				if (cookieKeyAndValue.length >= 2) {
					res[encodeURIComponent(cookieKeyAndValue[0])] = _decodeCookie(cookieKeyAndValue[1], decode)
				}
			}
			return res
		}

	var cookie = {
			get: function(k, decode) {
				decode = lang.isString(decode) ? decode.toUpperCase() : decode
				return lang.isString(k) ? _getCookie(document.cookie, k, decode)
										: _getAllCookie(document.cookie, decode)
			},
			set: function(k, v, expires, location, options) {
					// 兼容不同形式的过期时间
				var cookieExpiredDate = expires ?
											new Date(dateReg.test(expires) ?
												lang.getTime(expires) :
												lang.getTime(+new Date, expires)) :
											'',
					cookieString = _createCookieString(k, _makeCookieValue(v), cookieExpiredDate, location, options)

				return !cookieString || !!(document.cookie = cookieString)
			},
			// 这里要注意如果 path 和 domain 不对应是不能移除的
			remove: function(k, options) {
				if (!lang.isString(k)) return false
				document.cookie = _createCookieString(k, '', new Date(0), options)
				return true
			}
		}

	Vessel.extend('util.cookie', cookie)
}()

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
		console.warn('Your browser cannot support "localStorage", please use "cookie" instead.')
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
				return !lang.empty(expired) && lang.JSON.decode(expired) || {}
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
					lang.isset(expiredGroup[k]) &&
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
				if (this.expiredEnabled && lang.isset(expired)) {
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
				if (this.expiredEnabled && lang.isset(expiredGroup[k])) {
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

/**
 * connect.js
 * 读取处理异步数据或者上报异步数据的方法
 * rely: Vessel.js, lang.js, json.js
 * owner: rusherwang
 * create: 2016-1-21
 */
!function(window) {
	var lang = Vessel.lang,
		Ajax

	// 待完善 & 的情况
	Ajax = function(mode, settings) {
		this.mode = mode || 'GET'
		this.__construct(settings)
		return this
	}
	Ajax.prototype = {
		__construct: function(settings) {
			return this.send(settings)
		},
		// 构建 XMLHTTP 对象
		_createXMLHttpRequest: function() {
			if (window.XMLHttpRequest) {
				return function() {
					return new XMLHttpRequest()
				}
			} else if (window.ActiveXObject) {
				return function() {
					return new ActiveXObject('Microsoft.XMLHTTP')
				}
			}
		}(),
		send: function(settings) {
			var xhr = this._createXMLHttpRequest(),
				method = this.mode.toUpperCase(),
				encode = encodeURIComponent,
				url = settings.url || '/',
				data = settings.data || {},
				async = settings.async || true,
				dataType = settings.dataType && settings.dataType.toUpperCase() || '',
				callback = settings.callback || function() {},
				formatUrlFlag = lang.strstr('?', url),
				param = [],
				key, value, devide,
				_send = function(method, url, data, async) {
					var res
					xhr.open(method, url, async)
					// 回调函数的绑定，这里可以完善成各种状态的
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							res = xhr.responseText
							if (dataType === 'JSON') res = lang.JSON.decode(res)
							callback(res)
						}
					}
					if (method === 'POST') {
						xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
					}
					xhr.send(data)
				}

			// 将 data 数据转化成字符串
			if (lang.isObject(data)) {
				for (key in data) {
					value = lang.isString(data[key]) ? data[key] : lang.JSON.encode(data[key])
					param.push(encode(key) + '=' + encode(value))
				}
				data = param.join('&')
			} else if (lang.isString(data)) {
				data = encode(data)
			} else {
				data = 'data=' + encode(lang.JSON.encode(data))
			}

			// 如果在 url 里面已经加入了部分参数，就需要进行转化
			if (method === 'GET') {
				url += data && ((formatUrlFlag ? '&' : '?') + data) || ''
				_send(method, url, null, async)
			} else if (method === 'POST') {
				if (formatUrlFlag) {
					devide = url.split('?')
					url = devide[0]
					data += '&' + devide[1]
				}
				_send(method, url, data, async)
			}
			return
		}
	}

	var connect = {
			get: function(settings) {
				return new Ajax('GET', settings)
			},
			post: function(settings) {
				return new Ajax('POST', settings)
			},
			load: function(type, settings) {
				type = (type + '').toUpperCase()
				if (type === 'GET' || type === 'POST') {
					return new Ajax(type, settings)
				} else if (type === 'GETJSON') {
					settings.dataType = 'JSON'
					return new Ajax('GET', settings)
				}
			}
		}

	Vessel.extend('util.connect', connect)
}(window)

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
		div.innerHTML = '  <link/><table></table><a href="link">a</a><input type="checkbox"/>'
		a = div.getElementsByTagName('a')[0]
		a.style.cssText = 'top:1px;float:left;opacity:.5'
		input = div.getElementsByTagName('input')[0]

		support.getSetAttribute = div.className !== 'Vessel'

		// 确定 opacity 属性是否存在，IE678 是通过 filter 滤镜来支持透明度
		support.opacity = /^0.5/.test(a.style.opacity)
		// IE中 使用 innerHTML 时头部带有空格，将会舍去文本节点
		support.leadingWhitespace = div.firstChild.nodeType === 3
		// 当一个 table 为空时，标准浏览器不会在内部添加 tbody
		// 但是IE会这么做
		support.htmlTbody = !div.getElementsByTagName('tbody').length
		// 能否直接用 innerHTML 的方式插入 link 标签
		// 在IE中，需要在外面加一层包裹才能生效，否则会忽略该标签
		support.htmlLink = !!div.getElementsByTagName('link').length
		// 是否支持 html5 标签的克隆
		// 某些不完全支持 html5 标签的浏览器在克隆他们之后，outerHTML 会加上冒号
		support.html5Clone = document.createElement('nav').cloneNode(true).outerHTML !== '<:nav></:nav>'
		return support
	})({})
	
	Vessel.extend('browser', browser)
}(window)

/**
 * sizzle.js
 * https://sizzlejs.com/
 * 选择器
 */
!function(window) {

	var sizzle = 
	(function(window) {

		var i,
			support,
			Expr,
			getText,
			isXML,
			tokenize,
			compile,
			select,
			outermostContext,
			sortInput,
			hasDuplicate,

			// Local document vars
			setDocument,
			document,
			docElem,
			documentIsHTML,
			rbuggyQSA,
			rbuggyMatches,
			matches,
			contains,

			// Instance-specific data
			expando = "sizzle" + 1 * new Date(),
			preferredDoc = window.document,
			dirruns = 0,
			done = 0,
			classCache = createCache(),
			tokenCache = createCache(),
			compilerCache = createCache(),
			sortOrder = function( a, b ) {
				if ( a === b ) {
					hasDuplicate = true;
				}
				return 0;
			},

			// Instance methods
			hasOwn = ({}).hasOwnProperty,
			arr = [],
			pop = arr.pop,
			push_native = arr.push,
			push = arr.push,
			slice = arr.slice,
			// Use a stripped-down indexOf as it's faster than native
			// https://jsperf.com/thor-indexof-vs-for/5
			indexOf = function( list, elem ) {
				var i = 0,
					len = list.length;
				for ( ; i < len; i++ ) {
					if ( list[i] === elem ) {
						return i;
					}
				}
				return -1;
			},

			booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

			// Regular expressions

			// http://www.w3.org/TR/css3-selectors/#whitespace
			whitespace = "[\\x20\\t\\r\\n\\f]",

			// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
			identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

			// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
			attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
				// Operator (capture 2)
				"*([*^$|!~]?=)" + whitespace +
				// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
				"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
				"*\\]",

			pseudos = ":(" + identifier + ")(?:\\((" +
				// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
				// 1. quoted (capture 3; capture 4 or capture 5)
				"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
				// 2. simple (capture 6)
				"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
				// 3. anything else (capture 2)
				".*" +
				")\\)|)",

			// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
			rwhitespace = new RegExp( whitespace + "+", "g" ),
			rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

			rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
			rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

			rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

			rpseudo = new RegExp( pseudos ),
			ridentifier = new RegExp( "^" + identifier + "$" ),

			matchExpr = {
				"ID": new RegExp( "^#(" + identifier + ")" ),
				"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
				"TAG": new RegExp( "^(" + identifier + "|[*])" ),
				"ATTR": new RegExp( "^" + attributes ),
				"PSEUDO": new RegExp( "^" + pseudos ),
				"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
					"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
					"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
				"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
				// For use in libraries implementing .is()
				// We use this for POS matching in `select`
				"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
					whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
			},

			rinputs = /^(?:input|select|textarea|button)$/i,
			rheader = /^h\d$/i,

			rnative = /^[^{]+\{\s*\[native \w/,

			// Easily-parseable/retrievable ID or TAG or CLASS selectors
			rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

			rsibling = /[+~]/,

			// CSS escapes
			// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
			runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
			funescape = function( _, escaped, escapedWhitespace ) {
				var high = "0x" + escaped - 0x10000;
				// NaN means non-codepoint
				// Support: Firefox<24
				// Workaround erroneous numeric interpretation of +"0x"
				return high !== high || escapedWhitespace ?
					escaped :
					high < 0 ?
						// BMP codepoint
						String.fromCharCode( high + 0x10000 ) :
						// Supplemental Plane codepoint (surrogate pair)
						String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
			},

			// CSS string/identifier serialization
			// https://drafts.csswg.org/cssom/#common-serializing-idioms
			rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
			fcssescape = function( ch, asCodePoint ) {
				if ( asCodePoint ) {

					// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
					if ( ch === "\0" ) {
						return "\uFFFD";
					}

					// Control characters and (dependent upon position) numbers get escaped as code points
					return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
				}

				// Other potentially-special ASCII characters get backslash-escaped
				return "\\" + ch;
			},

			// Used for iframes
			// See setDocument()
			// Removing the function wrapper causes a "Permission Denied"
			// error in IE
			unloadHandler = function() {
				setDocument();
			},

			disabledAncestor = addCombinator(
				function( elem ) {
					return elem.disabled === true;
				},
				{ dir: "parentNode", next: "legend" }
			);

		// Optimize for push.apply( _, NodeList )
		try {
			push.apply(
				(arr = slice.call( preferredDoc.childNodes )),
				preferredDoc.childNodes
			);
			// Support: Android<4.0
			// Detect silently failing push.apply
			arr[ preferredDoc.childNodes.length ].nodeType;
		} catch ( e ) {
			push = { apply: arr.length ?

				// Leverage slice if possible
				function( target, els ) {
					push_native.apply( target, slice.call(els) );
				} :

				// Support: IE<9
				// Otherwise append directly
				function( target, els ) {
					var j = target.length,
						i = 0;
					// Can't trust NodeList.length
					while ( (target[j++] = els[i++]) ) {}
					target.length = j - 1;
				}
			};
		}

		function Sizzle( selector, context, results, seed ) {
			var m, i, elem, nid, match, groups, newSelector,
				newContext = context && context.ownerDocument,

				// nodeType defaults to 9, since context defaults to document
				nodeType = context ? context.nodeType : 9;

			results = results || [];

			// Return early from calls with invalid selector or context
			if ( typeof selector !== "string" || !selector ||
				nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

				return results;
			}

			// Try to shortcut find operations (as opposed to filters) in HTML documents
			if ( !seed ) {

				if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
					setDocument( context );
				}
				context = context || document;

				if ( documentIsHTML ) {

					// If the selector is sufficiently simple, try using a "get*By*" DOM method
					// (excepting DocumentFragment context, where the methods don't exist)
					if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

						// ID selector
						if ( (m = match[1]) ) {

							// Document context
							if ( nodeType === 9 ) {
								if ( (elem = context.getElementById( m )) ) {

									// Support: IE, Opera, Webkit
									// TODO: identify versions
									// getElementById can match elements by name instead of ID
									if ( elem.id === m ) {
										results.push( elem );
										return results;
									}
								} else {
									return results;
								}

							// Element context
							} else {

								// Support: IE, Opera, Webkit
								// TODO: identify versions
								// getElementById can match elements by name instead of ID
								if ( newContext && (elem = newContext.getElementById( m )) &&
									contains( context, elem ) &&
									elem.id === m ) {

									results.push( elem );
									return results;
								}
							}

						// Type selector
						} else if ( match[2] ) {
							push.apply( results, context.getElementsByTagName( selector ) );
							return results;

						// Class selector
						} else if ( (m = match[3]) && support.getElementsByClassName &&
							context.getElementsByClassName ) {

							push.apply( results, context.getElementsByClassName( m ) );
							return results;
						}
					}

					// Take advantage of querySelectorAll
					if ( support.qsa &&
						!compilerCache[ selector + " " ] &&
						(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

						if ( nodeType !== 1 ) {
							newContext = context;
							newSelector = selector;

						// qSA looks outside Element context, which is not what we want
						// Thanks to Andrew Dupont for this workaround technique
						// Support: IE <=8
						// Exclude object elements
						} else if ( context.nodeName.toLowerCase() !== "object" ) {

							// Capture the context ID, setting it first if necessary
							if ( (nid = context.getAttribute( "id" )) ) {
								nid = nid.replace( rcssescape, fcssescape );
							} else {
								context.setAttribute( "id", (nid = expando) );
							}

							// Prefix every selector in the list
							groups = tokenize( selector );
							i = groups.length;
							while ( i-- ) {
								groups[i] = "#" + nid + " " + toSelector( groups[i] );
							}
							newSelector = groups.join( "," );

							// Expand context for sibling selectors
							newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
								context;
						}

						if ( newSelector ) {
							try {
								push.apply( results,
									newContext.querySelectorAll( newSelector )
								);
								return results;
							} catch ( qsaError ) {
							} finally {
								if ( nid === expando ) {
									context.removeAttribute( "id" );
								}
							}
						}
					}
				}
			}

			// All others
			return select( selector.replace( rtrim, "$1" ), context, results, seed );
		}

		/**
		 * Create key-value caches of limited size
		 * @returns {function(string, object)} Returns the Object data after storing it on itself with
		 *  property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
		 *  deleting the oldest entry
		 */
		function createCache() {
			var keys = [];

			function cache( key, value ) {
				// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
				if ( keys.push( key + " " ) > Expr.cacheLength ) {
					// Only keep the most recent entries
					delete cache[ keys.shift() ];
				}
				return (cache[ key + " " ] = value);
			}
			return cache;
		}

		/**
		 * Mark a function for special use by Sizzle
		 * @param {Function} fn The function to mark
		 */
		function markFunction( fn ) {
			fn[ expando ] = true;
			return fn;
		}

		/**
		 * Support testing using an element
		 * @param {Function} fn Passed the created element and returns a boolean result
		 */
		function assert( fn ) {
			var el = document.createElement("fieldset");

			try {
				return !!fn( el );
			} catch (e) {
				return false;
			} finally {
				// Remove from its parent by default
				if ( el.parentNode ) {
					el.parentNode.removeChild( el );
				}
				// release memory in IE
				el = null;
			}
		}

		/**
		 * Adds the same handler for all of the specified attrs
		 * @param {String} attrs Pipe-separated list of attributes
		 * @param {Function} handler The method that will be applied
		 */
		function addHandle( attrs, handler ) {
			var arr = attrs.split("|"),
				i = arr.length;

			while ( i-- ) {
				Expr.attrHandle[ arr[i] ] = handler;
			}
		}

		/**
		 * Checks document order of two siblings
		 * @param {Element} a
		 * @param {Element} b
		 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
		 */
		function siblingCheck( a, b ) {
			var cur = b && a,
				diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
					a.sourceIndex - b.sourceIndex;

			// Use IE sourceIndex if available on both nodes
			if ( diff ) {
				return diff;
			}

			// Check if b follows a
			if ( cur ) {
				while ( (cur = cur.nextSibling) ) {
					if ( cur === b ) {
						return -1;
					}
				}
			}

			return a ? 1 : -1;
		}

		/**
		 * Returns a function to use in pseudos for input types
		 * @param {String} type
		 */
		function createInputPseudo( type ) {
			return function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === type;
			};
		}

		/**
		 * Returns a function to use in pseudos for buttons
		 * @param {String} type
		 */
		function createButtonPseudo( type ) {
			return function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return (name === "input" || name === "button") && elem.type === type;
			};
		}

		/**
		 * Returns a function to use in pseudos for :enabled/:disabled
		 * @param {Boolean} disabled true for :disabled; false for :enabled
		 */
		function createDisabledPseudo( disabled ) {
			// Known :disabled false positives:
			// IE: *[disabled]:not(button, input, select, textarea, optgroup, option, menuitem, fieldset)
			// not IE: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
			return function( elem ) {

				// Check form elements and option elements for explicit disabling
				return "label" in elem && elem.disabled === disabled ||
					"form" in elem && elem.disabled === disabled ||

					// Check non-disabled form elements for fieldset[disabled] ancestors
					"form" in elem && elem.disabled === false && (
						// Support: IE6-11+
						// Ancestry is covered for us
						elem.isDisabled === disabled ||

						// Otherwise, assume any non-<option> under fieldset[disabled] is disabled
						/* jshint -W018 */
						elem.isDisabled !== !disabled &&
							("label" in elem || !disabledAncestor( elem )) !== disabled
					);
			};
		}

		/**
		 * Returns a function to use in pseudos for positionals
		 * @param {Function} fn
		 */
		function createPositionalPseudo( fn ) {
			return markFunction(function( argument ) {
				argument = +argument;
				return markFunction(function( seed, matches ) {
					var j,
						matchIndexes = fn( [], seed.length, argument ),
						i = matchIndexes.length;

					// Match elements found at the specified indexes
					while ( i-- ) {
						if ( seed[ (j = matchIndexes[i]) ] ) {
							seed[j] = !(matches[j] = seed[j]);
						}
					}
				});
			});
		}

		/**
		 * Checks a node for validity as a Sizzle context
		 * @param {Element|Object=} context
		 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
		 */
		function testContext( context ) {
			return context && typeof context.getElementsByTagName !== "undefined" && context;
		}

		// Expose support vars for convenience
		support = Sizzle.support = {};

		/**
		 * Detects XML nodes
		 * @param {Element|Object} elem An element or a document
		 * @returns {Boolean} True iff elem is a non-HTML XML node
		 */
		isXML = Sizzle.isXML = function( elem ) {
			// documentElement is verified for cases where it doesn't yet exist
			// (such as loading iframes in IE - #4833)
			var documentElement = elem && (elem.ownerDocument || elem).documentElement;
			return documentElement ? documentElement.nodeName !== "HTML" : false;
		};

		/**
		 * Sets document-related variables once based on the current document
		 * @param {Element|Object} [doc] An element or document object to use to set the document
		 * @returns {Object} Returns the current document
		 */
		setDocument = Sizzle.setDocument = function( node ) {
			var hasCompare, subWindow,
				doc = node ? node.ownerDocument || node : preferredDoc;

			// Return early if doc is invalid or already selected
			if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
				return document;
			}

			// Update global variables
			document = doc;
			docElem = document.documentElement;
			documentIsHTML = !isXML( document );

			// Support: IE 9-11, Edge
			// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
			if ( preferredDoc !== document &&
				(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

				// Support: IE 11, Edge
				if ( subWindow.addEventListener ) {
					subWindow.addEventListener( "unload", unloadHandler, false );

				// Support: IE 9 - 10 only
				} else if ( subWindow.attachEvent ) {
					subWindow.attachEvent( "onunload", unloadHandler );
				}
			}

			/* Attributes
			---------------------------------------------------------------------- */

			// Support: IE<8
			// Verify that getAttribute really returns attributes and not properties
			// (excepting IE8 booleans)
			support.attributes = assert(function( el ) {
				el.className = "i";
				return !el.getAttribute("className");
			});

			/* getElement(s)By*
			---------------------------------------------------------------------- */

			// Check if getElementsByTagName("*") returns only elements
			support.getElementsByTagName = assert(function( el ) {
				el.appendChild( document.createComment("") );
				return !el.getElementsByTagName("*").length;
			});

			// Support: IE<9
			support.getElementsByClassName = rnative.test( document.getElementsByClassName );

			// Support: IE<10
			// Check if getElementById returns elements by name
			// The broken getElementById methods don't pick up programmatically-set names,
			// so use a roundabout getElementsByName test
			support.getById = assert(function( el ) {
				docElem.appendChild( el ).id = expando;
				return !document.getElementsByName || !document.getElementsByName( expando ).length;
			});

			// ID filter and find
			if ( support.getById ) {
				Expr.filter["ID"] = function( id ) {
					var attrId = id.replace( runescape, funescape );
					return function( elem ) {
						return elem.getAttribute("id") === attrId;
					};
				};
				Expr.find["ID"] = function( id, context ) {
					if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
						var elem = context.getElementById( id );
						return elem ? [ elem ] : [];
					}
				};
			} else {
				Expr.filter["ID"] =  function( id ) {
					var attrId = id.replace( runescape, funescape );
					return function( elem ) {
						var node = typeof elem.getAttributeNode !== "undefined" &&
							elem.getAttributeNode("id");
						return node && node.value === attrId;
					};
				};

				// Support: IE 6 - 7 only
				// getElementById is not reliable as a find shortcut
				Expr.find["ID"] = function( id, context ) {
					if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
						var node, i, elems,
							elem = context.getElementById( id );

						if ( elem ) {

							// Verify the id attribute
							node = elem.getAttributeNode("id");
							if ( node && node.value === id ) {
								return [ elem ];
							}

							// Fall back on getElementsByName
							elems = context.getElementsByName( id );
							i = 0;
							while ( (elem = elems[i++]) ) {
								node = elem.getAttributeNode("id");
								if ( node && node.value === id ) {
									return [ elem ];
								}
							}
						}

						return [];
					}
				};
			}

			// Tag
			Expr.find["TAG"] = support.getElementsByTagName ?
				function( tag, context ) {
					if ( typeof context.getElementsByTagName !== "undefined" ) {
						return context.getElementsByTagName( tag );

					// DocumentFragment nodes don't have gEBTN
					} else if ( support.qsa ) {
						return context.querySelectorAll( tag );
					}
				} :

				function( tag, context ) {
					var elem,
						tmp = [],
						i = 0,
						// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
						results = context.getElementsByTagName( tag );

					// Filter out possible comments
					if ( tag === "*" ) {
						while ( (elem = results[i++]) ) {
							if ( elem.nodeType === 1 ) {
								tmp.push( elem );
							}
						}

						return tmp;
					}
					return results;
				};

			// Class
			Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
				if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
					return context.getElementsByClassName( className );
				}
			};

			/* QSA/matchesSelector
			---------------------------------------------------------------------- */

			// QSA and matchesSelector support

			// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
			rbuggyMatches = [];

			// qSa(:focus) reports false when true (Chrome 21)
			// We allow this because of a bug in IE8/9 that throws an error
			// whenever `document.activeElement` is accessed on an iframe
			// So, we allow :focus to pass through QSA all the time to avoid the IE error
			// See https://bugs.jquery.com/ticket/13378
			rbuggyQSA = [];

			if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
				// Build QSA regex
				// Regex strategy adopted from Diego Perini
				assert(function( el ) {
					// Select is set to empty string on purpose
					// This is to test IE's treatment of not explicitly
					// setting a boolean content attribute,
					// since its presence should be enough
					// https://bugs.jquery.com/ticket/12359
					docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
						"<select id='" + expando + "-\r\\' msallowcapture=''>" +
						"<option selected=''></option></select>";

					// Support: IE8, Opera 11-12.16
					// Nothing should be selected when empty strings follow ^= or $= or *=
					// The test attribute must be unknown in Opera but "safe" for WinRT
					// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
					if ( el.querySelectorAll("[msallowcapture^='']").length ) {
						rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
					}

					// Support: IE8
					// Boolean attributes and "value" are not treated correctly
					if ( !el.querySelectorAll("[selected]").length ) {
						rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
					}

					// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
					if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
						rbuggyQSA.push("~=");
					}

					// Webkit/Opera - :checked should return selected option elements
					// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
					// IE8 throws error here and will not see later tests
					if ( !el.querySelectorAll(":checked").length ) {
						rbuggyQSA.push(":checked");
					}

					// Support: Safari 8+, iOS 8+
					// https://bugs.webkit.org/show_bug.cgi?id=136851
					// In-page `selector#id sibling-combinator selector` fails
					if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
						rbuggyQSA.push(".#.+[+~]");
					}
				});

				assert(function( el ) {
					el.innerHTML = "<a href='' disabled='disabled'></a>" +
						"<select disabled='disabled'><option/></select>";

					// Support: Windows 8 Native Apps
					// The type and name attributes are restricted during .innerHTML assignment
					var input = document.createElement("input");
					input.setAttribute( "type", "hidden" );
					el.appendChild( input ).setAttribute( "name", "D" );

					// Support: IE8
					// Enforce case-sensitivity of name attribute
					if ( el.querySelectorAll("[name=d]").length ) {
						rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
					}

					// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
					// IE8 throws error here and will not see later tests
					if ( el.querySelectorAll(":enabled").length !== 2 ) {
						rbuggyQSA.push( ":enabled", ":disabled" );
					}

					// Support: IE9-11+
					// IE's :disabled selector does not pick up the children of disabled fieldsets
					docElem.appendChild( el ).disabled = true;
					if ( el.querySelectorAll(":disabled").length !== 2 ) {
						rbuggyQSA.push( ":enabled", ":disabled" );
					}

					// Opera 10-11 does not throw on post-comma invalid pseudos
					el.querySelectorAll("*,:x");
					rbuggyQSA.push(",.*:");
				});
			}

			if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
				docElem.webkitMatchesSelector ||
				docElem.mozMatchesSelector ||
				docElem.oMatchesSelector ||
				docElem.msMatchesSelector) )) ) {

				assert(function( el ) {
					// Check to see if it's possible to do matchesSelector
					// on a disconnected node (IE 9)
					support.disconnectedMatch = matches.call( el, "*" );

					// This should fail with an exception
					// Gecko does not error, returns false instead
					matches.call( el, "[s!='']:x" );
					rbuggyMatches.push( "!=", pseudos );
				});
			}

			rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
			rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

			/* Contains
			---------------------------------------------------------------------- */
			hasCompare = rnative.test( docElem.compareDocumentPosition );

			// Element contains another
			// Purposefully self-exclusive
			// As in, an element does not contain itself
			contains = hasCompare || rnative.test( docElem.contains ) ?
				function( a, b ) {
					var adown = a.nodeType === 9 ? a.documentElement : a,
						bup = b && b.parentNode;
					return a === bup || !!( bup && bup.nodeType === 1 && (
						adown.contains ?
							adown.contains( bup ) :
							a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
					));
				} :
				function( a, b ) {
					if ( b ) {
						while ( (b = b.parentNode) ) {
							if ( b === a ) {
								return true;
							}
						}
					}
					return false;
				};

			/* Sorting
			---------------------------------------------------------------------- */

			// Document order sorting
			sortOrder = hasCompare ?
			function( a, b ) {

				// Flag for duplicate removal
				if ( a === b ) {
					hasDuplicate = true;
					return 0;
				}

				// Sort on method existence if only one input has compareDocumentPosition
				var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
				if ( compare ) {
					return compare;
				}

				// Calculate position if both inputs belong to the same document
				compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
					a.compareDocumentPosition( b ) :

					// Otherwise we know they are disconnected
					1;

				// Disconnected nodes
				if ( compare & 1 ||
					(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

					// Choose the first element that is related to our preferred document
					if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
						return -1;
					}
					if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
						return 1;
					}

					// Maintain original order
					return sortInput ?
						( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
						0;
				}

				return compare & 4 ? -1 : 1;
			} :
			function( a, b ) {
				// Exit early if the nodes are identical
				if ( a === b ) {
					hasDuplicate = true;
					return 0;
				}

				var cur,
					i = 0,
					aup = a.parentNode,
					bup = b.parentNode,
					ap = [ a ],
					bp = [ b ];

				// Parentless nodes are either documents or disconnected
				if ( !aup || !bup ) {
					return a === document ? -1 :
						b === document ? 1 :
						aup ? -1 :
						bup ? 1 :
						sortInput ?
						( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
						0;

				// If the nodes are siblings, we can do a quick check
				} else if ( aup === bup ) {
					return siblingCheck( a, b );
				}

				// Otherwise we need full lists of their ancestors for comparison
				cur = a;
				while ( (cur = cur.parentNode) ) {
					ap.unshift( cur );
				}
				cur = b;
				while ( (cur = cur.parentNode) ) {
					bp.unshift( cur );
				}

				// Walk down the tree looking for a discrepancy
				while ( ap[i] === bp[i] ) {
					i++;
				}

				return i ?
					// Do a sibling check if the nodes have a common ancestor
					siblingCheck( ap[i], bp[i] ) :

					// Otherwise nodes in our document sort first
					ap[i] === preferredDoc ? -1 :
					bp[i] === preferredDoc ? 1 :
					0;
			};

			return document;
		};

		Sizzle.matches = function( expr, elements ) {
			return Sizzle( expr, null, null, elements );
		};

		Sizzle.matchesSelector = function( elem, expr ) {
			// Set document vars if needed
			if ( ( elem.ownerDocument || elem ) !== document ) {
				setDocument( elem );
			}

			// Make sure that attribute selectors are quoted
			expr = expr.replace( rattributeQuotes, "='$1']" );

			if ( support.matchesSelector && documentIsHTML &&
				!compilerCache[ expr + " " ] &&
				( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
				( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

				try {
					var ret = matches.call( elem, expr );

					// IE 9's matchesSelector returns false on disconnected nodes
					if ( ret || support.disconnectedMatch ||
							// As well, disconnected nodes are said to be in a document
							// fragment in IE 9
							elem.document && elem.document.nodeType !== 11 ) {
						return ret;
					}
				} catch (e) {}
			}

			return Sizzle( expr, document, null, [ elem ] ).length > 0;
		};

		Sizzle.contains = function( context, elem ) {
			// Set document vars if needed
			if ( ( context.ownerDocument || context ) !== document ) {
				setDocument( context );
			}
			return contains( context, elem );
		};

		Sizzle.attr = function( elem, name ) {
			// Set document vars if needed
			if ( ( elem.ownerDocument || elem ) !== document ) {
				setDocument( elem );
			}

			var fn = Expr.attrHandle[ name.toLowerCase() ],
				// Don't get fooled by Object.prototype properties (jQuery #13807)
				val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
					fn( elem, name, !documentIsHTML ) :
					undefined;

			return val !== undefined ?
				val :
				support.attributes || !documentIsHTML ?
					elem.getAttribute( name ) :
					(val = elem.getAttributeNode(name)) && val.specified ?
						val.value :
						null;
		};

		Sizzle.escape = function( sel ) {
			return (sel + "").replace( rcssescape, fcssescape );
		};

		Sizzle.error = function( msg ) {
			throw new Error( "Syntax error, unrecognized expression: " + msg );
		};

		/**
		 * Document sorting and removing duplicates
		 * @param {ArrayLike} results
		 */
		Sizzle.uniqueSort = function( results ) {
			var elem,
				duplicates = [],
				j = 0,
				i = 0;

			// Unless we *know* we can detect duplicates, assume their presence
			hasDuplicate = !support.detectDuplicates;
			sortInput = !support.sortStable && results.slice( 0 );
			results.sort( sortOrder );

			if ( hasDuplicate ) {
				while ( (elem = results[i++]) ) {
					if ( elem === results[ i ] ) {
						j = duplicates.push( i );
					}
				}
				while ( j-- ) {
					results.splice( duplicates[ j ], 1 );
				}
			}

			// Clear input after sorting to release objects
			// See https://github.com/jquery/sizzle/pull/225
			sortInput = null;

			return results;
		};

		/**
		 * Utility function for retrieving the text value of an array of DOM nodes
		 * @param {Array|Element} elem
		 */
		getText = Sizzle.getText = function( elem ) {
			var node,
				ret = "",
				i = 0,
				nodeType = elem.nodeType;

			if ( !nodeType ) {
				// If no nodeType, this is expected to be an array
				while ( (node = elem[i++]) ) {
					// Do not traverse comment nodes
					ret += getText( node );
				}
			} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
				// Use textContent for elements
				// innerText usage removed for consistency of new lines (jQuery #11153)
				if ( typeof elem.textContent === "string" ) {
					return elem.textContent;
				} else {
					// Traverse its children
					for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
						ret += getText( elem );
					}
				}
			} else if ( nodeType === 3 || nodeType === 4 ) {
				return elem.nodeValue;
			}
			// Do not include comment or processing instruction nodes

			return ret;
		};

		Expr = Sizzle.selectors = {

			// Can be adjusted by the user
			cacheLength: 50,

			createPseudo: markFunction,

			match: matchExpr,

			attrHandle: {},

			find: {},

			relative: {
				">": { dir: "parentNode", first: true },
				" ": { dir: "parentNode" },
				"+": { dir: "previousSibling", first: true },
				"~": { dir: "previousSibling" }
			},

			preFilter: {
				"ATTR": function( match ) {
					match[1] = match[1].replace( runescape, funescape );

					// Move the given value to match[3] whether quoted or unquoted
					match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

					if ( match[2] === "~=" ) {
						match[3] = " " + match[3] + " ";
					}

					return match.slice( 0, 4 );
				},

				"CHILD": function( match ) {
					/* matches from matchExpr["CHILD"]
						1 type (only|nth|...)
						2 what (child|of-type)
						3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
						4 xn-component of xn+y argument ([+-]?\d*n|)
						5 sign of xn-component
						6 x of xn-component
						7 sign of y-component
						8 y of y-component
					*/
					match[1] = match[1].toLowerCase();

					if ( match[1].slice( 0, 3 ) === "nth" ) {
						// nth-* requires argument
						if ( !match[3] ) {
							Sizzle.error( match[0] );
						}

						// numeric x and y parameters for Expr.filter.CHILD
						// remember that false/true cast respectively to 0/1
						match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
						match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

					// other types prohibit arguments
					} else if ( match[3] ) {
						Sizzle.error( match[0] );
					}

					return match;
				},

				"PSEUDO": function( match ) {
					var excess,
						unquoted = !match[6] && match[2];

					if ( matchExpr["CHILD"].test( match[0] ) ) {
						return null;
					}

					// Accept quoted arguments as-is
					if ( match[3] ) {
						match[2] = match[4] || match[5] || "";

					// Strip excess characters from unquoted arguments
					} else if ( unquoted && rpseudo.test( unquoted ) &&
						// Get excess from tokenize (recursively)
						(excess = tokenize( unquoted, true )) &&
						// advance to the next closing parenthesis
						(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

						// excess is a negative index
						match[0] = match[0].slice( 0, excess );
						match[2] = unquoted.slice( 0, excess );
					}

					// Return only captures needed by the pseudo filter method (type and argument)
					return match.slice( 0, 3 );
				}
			},

			filter: {

				"TAG": function( nodeNameSelector ) {
					var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
					return nodeNameSelector === "*" ?
						function() { return true; } :
						function( elem ) {
							return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
						};
				},

				"CLASS": function( className ) {
					var pattern = classCache[ className + " " ];

					return pattern ||
						(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
						classCache( className, function( elem ) {
							return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
						});
				},

				"ATTR": function( name, operator, check ) {
					return function( elem ) {
						var result = Sizzle.attr( elem, name );

						if ( result == null ) {
							return operator === "!=";
						}
						if ( !operator ) {
							return true;
						}

						result += "";

						return operator === "=" ? result === check :
							operator === "!=" ? result !== check :
							operator === "^=" ? check && result.indexOf( check ) === 0 :
							operator === "*=" ? check && result.indexOf( check ) > -1 :
							operator === "$=" ? check && result.slice( -check.length ) === check :
							operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
							operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
							false;
					};
				},

				"CHILD": function( type, what, argument, first, last ) {
					var simple = type.slice( 0, 3 ) !== "nth",
						forward = type.slice( -4 ) !== "last",
						ofType = what === "of-type";

					return first === 1 && last === 0 ?

						// Shortcut for :nth-*(n)
						function( elem ) {
							return !!elem.parentNode;
						} :

						function( elem, context, xml ) {
							var cache, uniqueCache, outerCache, node, nodeIndex, start,
								dir = simple !== forward ? "nextSibling" : "previousSibling",
								parent = elem.parentNode,
								name = ofType && elem.nodeName.toLowerCase(),
								useCache = !xml && !ofType,
								diff = false;

							if ( parent ) {

								// :(first|last|only)-(child|of-type)
								if ( simple ) {
									while ( dir ) {
										node = elem;
										while ( (node = node[ dir ]) ) {
											if ( ofType ?
												node.nodeName.toLowerCase() === name :
												node.nodeType === 1 ) {

												return false;
											}
										}
										// Reverse direction for :only-* (if we haven't yet done so)
										start = dir = type === "only" && !start && "nextSibling";
									}
									return true;
								}

								start = [ forward ? parent.firstChild : parent.lastChild ];

								// non-xml :nth-child(...) stores cache data on `parent`
								if ( forward && useCache ) {

									// Seek `elem` from a previously-cached index

									// ...in a gzip-friendly way
									node = parent;
									outerCache = node[ expando ] || (node[ expando ] = {});

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[ node.uniqueID ] ||
										(outerCache[ node.uniqueID ] = {});

									cache = uniqueCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex && cache[ 2 ];
									node = nodeIndex && parent.childNodes[ nodeIndex ];

									while ( (node = ++nodeIndex && node && node[ dir ] ||

										// Fallback to seeking `elem` from the start
										(diff = nodeIndex = 0) || start.pop()) ) {

										// When found, cache indexes on `parent` and break
										if ( node.nodeType === 1 && ++diff && node === elem ) {
											uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
											break;
										}
									}

								} else {
									// Use previously-cached element index if available
									if ( useCache ) {
										// ...in a gzip-friendly way
										node = elem;
										outerCache = node[ expando ] || (node[ expando ] = {});

										// Support: IE <9 only
										// Defend against cloned attroperties (jQuery gh-1709)
										uniqueCache = outerCache[ node.uniqueID ] ||
											(outerCache[ node.uniqueID ] = {});

										cache = uniqueCache[ type ] || [];
										nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
										diff = nodeIndex;
									}

									// xml :nth-child(...)
									// or :nth-last-child(...) or :nth(-last)?-of-type(...)
									if ( diff === false ) {
										// Use the same loop as above to seek `elem` from the start
										while ( (node = ++nodeIndex && node && node[ dir ] ||
											(diff = nodeIndex = 0) || start.pop()) ) {

											if ( ( ofType ?
												node.nodeName.toLowerCase() === name :
												node.nodeType === 1 ) &&
												++diff ) {

												// Cache the index of each encountered element
												if ( useCache ) {
													outerCache = node[ expando ] || (node[ expando ] = {});

													// Support: IE <9 only
													// Defend against cloned attroperties (jQuery gh-1709)
													uniqueCache = outerCache[ node.uniqueID ] ||
														(outerCache[ node.uniqueID ] = {});

													uniqueCache[ type ] = [ dirruns, diff ];
												}

												if ( node === elem ) {
													break;
												}
											}
										}
									}
								}

								// Incorporate the offset, then check against cycle size
								diff -= last;
								return diff === first || ( diff % first === 0 && diff / first >= 0 );
							}
						};
				},

				"PSEUDO": function( pseudo, argument ) {
					// pseudo-class names are case-insensitive
					// http://www.w3.org/TR/selectors/#pseudo-classes
					// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
					// Remember that setFilters inherits from pseudos
					var args,
						fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
							Sizzle.error( "unsupported pseudo: " + pseudo );

					// The user may use createPseudo to indicate that
					// arguments are needed to create the filter function
					// just as Sizzle does
					if ( fn[ expando ] ) {
						return fn( argument );
					}

					// But maintain support for old signatures
					if ( fn.length > 1 ) {
						args = [ pseudo, pseudo, "", argument ];
						return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
							markFunction(function( seed, matches ) {
								var idx,
									matched = fn( seed, argument ),
									i = matched.length;
								while ( i-- ) {
									idx = indexOf( seed, matched[i] );
									seed[ idx ] = !( matches[ idx ] = matched[i] );
								}
							}) :
							function( elem ) {
								return fn( elem, 0, args );
							};
					}

					return fn;
				}
			},

			pseudos: {
				// Potentially complex pseudos
				"not": markFunction(function( selector ) {
					// Trim the selector passed to compile
					// to avoid treating leading and trailing
					// spaces as combinators
					var input = [],
						results = [],
						matcher = compile( selector.replace( rtrim, "$1" ) );

					return matcher[ expando ] ?
						markFunction(function( seed, matches, context, xml ) {
							var elem,
								unmatched = matcher( seed, null, xml, [] ),
								i = seed.length;

							// Match elements unmatched by `matcher`
							while ( i-- ) {
								if ( (elem = unmatched[i]) ) {
									seed[i] = !(matches[i] = elem);
								}
							}
						}) :
						function( elem, context, xml ) {
							input[0] = elem;
							matcher( input, null, xml, results );
							// Don't keep the element (issue #299)
							input[0] = null;
							return !results.pop();
						};
				}),

				"has": markFunction(function( selector ) {
					return function( elem ) {
						return Sizzle( selector, elem ).length > 0;
					};
				}),

				"contains": markFunction(function( text ) {
					text = text.replace( runescape, funescape );
					return function( elem ) {
						return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
					};
				}),

				// "Whether an element is represented by a :lang() selector
				// is based solely on the element's language value
				// being equal to the identifier C,
				// or beginning with the identifier C immediately followed by "-".
				// The matching of C against the element's language value is performed case-insensitively.
				// The identifier C does not have to be a valid language name."
				// http://www.w3.org/TR/selectors/#lang-pseudo
				"lang": markFunction( function( lang ) {
					// lang value must be a valid identifier
					if ( !ridentifier.test(lang || "") ) {
						Sizzle.error( "unsupported lang: " + lang );
					}
					lang = lang.replace( runescape, funescape ).toLowerCase();
					return function( elem ) {
						var elemLang;
						do {
							if ( (elemLang = documentIsHTML ?
								elem.lang :
								elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

								elemLang = elemLang.toLowerCase();
								return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
							}
						} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
						return false;
					};
				}),

				// Miscellaneous
				"target": function( elem ) {
					var hash = window.location && window.location.hash;
					return hash && hash.slice( 1 ) === elem.id;
				},

				"root": function( elem ) {
					return elem === docElem;
				},

				"focus": function( elem ) {
					return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
				},

				// Boolean properties
				"enabled": createDisabledPseudo( false ),
				"disabled": createDisabledPseudo( true ),

				"checked": function( elem ) {
					// In CSS3, :checked should return both checked and selected elements
					// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
					var nodeName = elem.nodeName.toLowerCase();
					return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
				},

				"selected": function( elem ) {
					// Accessing this property makes selected-by-default
					// options in Safari work properly
					if ( elem.parentNode ) {
						elem.parentNode.selectedIndex;
					}

					return elem.selected === true;
				},

				// Contents
				"empty": function( elem ) {
					// http://www.w3.org/TR/selectors/#empty-pseudo
					// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
					//   but not by others (comment: 8; processing instruction: 7; etc.)
					// nodeType < 6 works because attributes (2) do not appear as children
					for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
						if ( elem.nodeType < 6 ) {
							return false;
						}
					}
					return true;
				},

				"parent": function( elem ) {
					return !Expr.pseudos["empty"]( elem );
				},

				// Element/input types
				"header": function( elem ) {
					return rheader.test( elem.nodeName );
				},

				"input": function( elem ) {
					return rinputs.test( elem.nodeName );
				},

				"button": function( elem ) {
					var name = elem.nodeName.toLowerCase();
					return name === "input" && elem.type === "button" || name === "button";
				},

				"text": function( elem ) {
					var attr;
					return elem.nodeName.toLowerCase() === "input" &&
						elem.type === "text" &&

						// Support: IE<8
						// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
						( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
				},

				// Position-in-collection
				"first": createPositionalPseudo(function() {
					return [ 0 ];
				}),

				"last": createPositionalPseudo(function( matchIndexes, length ) {
					return [ length - 1 ];
				}),

				"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
					return [ argument < 0 ? argument + length : argument ];
				}),

				"even": createPositionalPseudo(function( matchIndexes, length ) {
					var i = 0;
					for ( ; i < length; i += 2 ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				}),

				"odd": createPositionalPseudo(function( matchIndexes, length ) {
					var i = 1;
					for ( ; i < length; i += 2 ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				}),

				"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
					var i = argument < 0 ? argument + length : argument;
					for ( ; --i >= 0; ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				}),

				"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
					var i = argument < 0 ? argument + length : argument;
					for ( ; ++i < length; ) {
						matchIndexes.push( i );
					}
					return matchIndexes;
				})
			}
		};

		Expr.pseudos["nth"] = Expr.pseudos["eq"];

		// Add button/input type pseudos
		for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
			Expr.pseudos[ i ] = createInputPseudo( i );
		}
		for ( i in { submit: true, reset: true } ) {
			Expr.pseudos[ i ] = createButtonPseudo( i );
		}

		// Easy API for creating new setFilters
		function setFilters() {}
		setFilters.prototype = Expr.filters = Expr.pseudos;
		Expr.setFilters = new setFilters();

		tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
			var matched, match, tokens, type,
				soFar, groups, preFilters,
				cached = tokenCache[ selector + " " ];

			if ( cached ) {
				return parseOnly ? 0 : cached.slice( 0 );
			}

			soFar = selector;
			groups = [];
			preFilters = Expr.preFilter;

			while ( soFar ) {

				// Comma and first run
				if ( !matched || (match = rcomma.exec( soFar )) ) {
					if ( match ) {
						// Don't consume trailing commas as valid
						soFar = soFar.slice( match[0].length ) || soFar;
					}
					groups.push( (tokens = []) );
				}

				matched = false;

				// Combinators
				if ( (match = rcombinators.exec( soFar )) ) {
					matched = match.shift();
					tokens.push({
						value: matched,
						// Cast descendant combinators to space
						type: match[0].replace( rtrim, " " )
					});
					soFar = soFar.slice( matched.length );
				}

				// Filters
				for ( type in Expr.filter ) {
					if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
						(match = preFilters[ type ]( match ))) ) {
						matched = match.shift();
						tokens.push({
							value: matched,
							type: type,
							matches: match
						});
						soFar = soFar.slice( matched.length );
					}
				}

				if ( !matched ) {
					break;
				}
			}

			// Return the length of the invalid excess
			// if we're just parsing
			// Otherwise, throw an error or return tokens
			return parseOnly ?
				soFar.length :
				soFar ?
					Sizzle.error( selector ) :
					// Cache the tokens
					tokenCache( selector, groups ).slice( 0 );
		};

		function toSelector( tokens ) {
			var i = 0,
				len = tokens.length,
				selector = "";
			for ( ; i < len; i++ ) {
				selector += tokens[i].value;
			}
			return selector;
		}

		function addCombinator( matcher, combinator, base ) {
			var dir = combinator.dir,
				skip = combinator.next,
				key = skip || dir,
				checkNonElements = base && key === "parentNode",
				doneName = done++;

			return combinator.first ?
				// Check against closest ancestor/preceding element
				function( elem, context, xml ) {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							return matcher( elem, context, xml );
						}
					}
				} :

				// Check against all ancestor/preceding elements
				function( elem, context, xml ) {
					var oldCache, uniqueCache, outerCache,
						newCache = [ dirruns, doneName ];

					// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
					if ( xml ) {
						while ( (elem = elem[ dir ]) ) {
							if ( elem.nodeType === 1 || checkNonElements ) {
								if ( matcher( elem, context, xml ) ) {
									return true;
								}
							}
						}
					} else {
						while ( (elem = elem[ dir ]) ) {
							if ( elem.nodeType === 1 || checkNonElements ) {
								outerCache = elem[ expando ] || (elem[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

								if ( skip && skip === elem.nodeName.toLowerCase() ) {
									elem = elem[ dir ] || elem;
								} else if ( (oldCache = uniqueCache[ key ]) &&
									oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

									// Assign to newCache so results back-propagate to previous elements
									return (newCache[ 2 ] = oldCache[ 2 ]);
								} else {
									// Reuse newcache so results back-propagate to previous elements
									uniqueCache[ key ] = newCache;

									// A match means we're done; a fail means we have to keep checking
									if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
										return true;
									}
								}
							}
						}
					}
				};
		}

		function elementMatcher( matchers ) {
			return matchers.length > 1 ?
				function( elem, context, xml ) {
					var i = matchers.length;
					while ( i-- ) {
						if ( !matchers[i]( elem, context, xml ) ) {
							return false;
						}
					}
					return true;
				} :
				matchers[0];
		}

		function multipleContexts( selector, contexts, results ) {
			var i = 0,
				len = contexts.length;
			for ( ; i < len; i++ ) {
				Sizzle( selector, contexts[i], results );
			}
			return results;
		}

		function condense( unmatched, map, filter, context, xml ) {
			var elem,
				newUnmatched = [],
				i = 0,
				len = unmatched.length,
				mapped = map != null;

			for ( ; i < len; i++ ) {
				if ( (elem = unmatched[i]) ) {
					if ( !filter || filter( elem, context, xml ) ) {
						newUnmatched.push( elem );
						if ( mapped ) {
							map.push( i );
						}
					}
				}
			}

			return newUnmatched;
		}

		function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
			if ( postFilter && !postFilter[ expando ] ) {
				postFilter = setMatcher( postFilter );
			}
			if ( postFinder && !postFinder[ expando ] ) {
				postFinder = setMatcher( postFinder, postSelector );
			}
			return markFunction(function( seed, results, context, xml ) {
				var temp, i, elem,
					preMap = [],
					postMap = [],
					preexisting = results.length,

					// Get initial elements from seed or context
					elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

					// Prefilter to get matcher input, preserving a map for seed-results synchronization
					matcherIn = preFilter && ( seed || !selector ) ?
						condense( elems, preMap, preFilter, context, xml ) :
						elems,

					matcherOut = matcher ?
						// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
						postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

							// ...intermediate processing is necessary
							[] :

							// ...otherwise use results directly
							results :
						matcherIn;

				// Find primary matches
				if ( matcher ) {
					matcher( matcherIn, matcherOut, context, xml );
				}

				// Apply postFilter
				if ( postFilter ) {
					temp = condense( matcherOut, postMap );
					postFilter( temp, [], context, xml );

					// Un-match failing elements by moving them back to matcherIn
					i = temp.length;
					while ( i-- ) {
						if ( (elem = temp[i]) ) {
							matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
						}
					}
				}

				if ( seed ) {
					if ( postFinder || preFilter ) {
						if ( postFinder ) {
							// Get the final matcherOut by condensing this intermediate into postFinder contexts
							temp = [];
							i = matcherOut.length;
							while ( i-- ) {
								if ( (elem = matcherOut[i]) ) {
									// Restore matcherIn since elem is not yet a final match
									temp.push( (matcherIn[i] = elem) );
								}
							}
							postFinder( null, (matcherOut = []), temp, xml );
						}

						// Move matched elements from seed to results to keep them synchronized
						i = matcherOut.length;
						while ( i-- ) {
							if ( (elem = matcherOut[i]) &&
								(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

								seed[temp] = !(results[temp] = elem);
							}
						}
					}

				// Add elements to results, through postFinder if defined
				} else {
					matcherOut = condense(
						matcherOut === results ?
							matcherOut.splice( preexisting, matcherOut.length ) :
							matcherOut
					);
					if ( postFinder ) {
						postFinder( null, results, matcherOut, xml );
					} else {
						push.apply( results, matcherOut );
					}
				}
			});
		}

		function matcherFromTokens( tokens ) {
			var checkContext, matcher, j,
				len = tokens.length,
				leadingRelative = Expr.relative[ tokens[0].type ],
				implicitRelative = leadingRelative || Expr.relative[" "],
				i = leadingRelative ? 1 : 0,

				// The foundational matcher ensures that elements are reachable from top-level context(s)
				matchContext = addCombinator( function( elem ) {
					return elem === checkContext;
				}, implicitRelative, true ),
				matchAnyContext = addCombinator( function( elem ) {
					return indexOf( checkContext, elem ) > -1;
				}, implicitRelative, true ),
				matchers = [ function( elem, context, xml ) {
					var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
						(checkContext = context).nodeType ?
							matchContext( elem, context, xml ) :
							matchAnyContext( elem, context, xml ) );
					// Avoid hanging onto element (issue #299)
					checkContext = null;
					return ret;
				} ];

			for ( ; i < len; i++ ) {
				if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
					matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
				} else {
					matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

					// Return special upon seeing a positional matcher
					if ( matcher[ expando ] ) {
						// Find the next relative operator (if any) for proper handling
						j = ++i;
						for ( ; j < len; j++ ) {
							if ( Expr.relative[ tokens[j].type ] ) {
								break;
							}
						}
						return setMatcher(
							i > 1 && elementMatcher( matchers ),
							i > 1 && toSelector(
								// If the preceding token was a descendant combinator, insert an implicit any-element `*`
								tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
							).replace( rtrim, "$1" ),
							matcher,
							i < j && matcherFromTokens( tokens.slice( i, j ) ),
							j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
							j < len && toSelector( tokens )
						);
					}
					matchers.push( matcher );
				}
			}

			return elementMatcher( matchers );
		}

		function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
			var bySet = setMatchers.length > 0,
				byElement = elementMatchers.length > 0,
				superMatcher = function( seed, context, xml, results, outermost ) {
					var elem, j, matcher,
						matchedCount = 0,
						i = "0",
						unmatched = seed && [],
						setMatched = [],
						contextBackup = outermostContext,
						// We must always have either seed elements or outermost context
						elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
						// Use integer dirruns iff this is the outermost matcher
						dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
						len = elems.length;

					if ( outermost ) {
						outermostContext = context === document || context || outermost;
					}

					// Add elements passing elementMatchers directly to results
					// Support: IE<9, Safari
					// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
					for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
						if ( byElement && elem ) {
							j = 0;
							if ( !context && elem.ownerDocument !== document ) {
								setDocument( elem );
								xml = !documentIsHTML;
							}
							while ( (matcher = elementMatchers[j++]) ) {
								if ( matcher( elem, context || document, xml) ) {
									results.push( elem );
									break;
								}
							}
							if ( outermost ) {
								dirruns = dirrunsUnique;
							}
						}

						// Track unmatched elements for set filters
						if ( bySet ) {
							// They will have gone through all possible matchers
							if ( (elem = !matcher && elem) ) {
								matchedCount--;
							}

							// Lengthen the array for every element, matched or not
							if ( seed ) {
								unmatched.push( elem );
							}
						}
					}

					// `i` is now the count of elements visited above, and adding it to `matchedCount`
					// makes the latter nonnegative.
					matchedCount += i;

					// Apply set filters to unmatched elements
					// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
					// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
					// no element matchers and no seed.
					// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
					// case, which will result in a "00" `matchedCount` that differs from `i` but is also
					// numerically zero.
					if ( bySet && i !== matchedCount ) {
						j = 0;
						while ( (matcher = setMatchers[j++]) ) {
							matcher( unmatched, setMatched, context, xml );
						}

						if ( seed ) {
							// Reintegrate element matches to eliminate the need for sorting
							if ( matchedCount > 0 ) {
								while ( i-- ) {
									if ( !(unmatched[i] || setMatched[i]) ) {
										setMatched[i] = pop.call( results );
									}
								}
							}

							// Discard index placeholder values to get only actual matches
							setMatched = condense( setMatched );
						}

						// Add matches to results
						push.apply( results, setMatched );

						// Seedless set matches succeeding multiple successful matchers stipulate sorting
						if ( outermost && !seed && setMatched.length > 0 &&
							( matchedCount + setMatchers.length ) > 1 ) {

							Sizzle.uniqueSort( results );
						}
					}

					// Override manipulation of globals by nested matchers
					if ( outermost ) {
						dirruns = dirrunsUnique;
						outermostContext = contextBackup;
					}

					return unmatched;
				};

			return bySet ?
				markFunction( superMatcher ) :
				superMatcher;
		}

		compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
			var i,
				setMatchers = [],
				elementMatchers = [],
				cached = compilerCache[ selector + " " ];

			if ( !cached ) {
				// Generate a function of recursive functions that can be used to check each element
				if ( !match ) {
					match = tokenize( selector );
				}
				i = match.length;
				while ( i-- ) {
					cached = matcherFromTokens( match[i] );
					if ( cached[ expando ] ) {
						setMatchers.push( cached );
					} else {
						elementMatchers.push( cached );
					}
				}

				// Cache the compiled function
				cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

				// Save selector and tokenization
				cached.selector = selector;
			}
			return cached;
		};

		/**
		 * A low-level selection function that works with Sizzle's compiled
		 *  selector functions
		 * @param {String|Function} selector A selector or a pre-compiled
		 *  selector function built with Sizzle.compile
		 * @param {Element} context
		 * @param {Array} [results]
		 * @param {Array} [seed] A set of elements to match against
		 */
		select = Sizzle.select = function( selector, context, results, seed ) {
			var i, tokens, token, type, find,
				compiled = typeof selector === "function" && selector,
				match = !seed && tokenize( (selector = compiled.selector || selector) );

			results = results || [];

			// Try to minimize operations if there is only one selector in the list and no seed
			// (the latter of which guarantees us context)
			if ( match.length === 1 ) {

				// Reduce context if the leading compound selector is an ID
				tokens = match[0] = match[0].slice( 0 );
				if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
						context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

					context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
					if ( !context ) {
						return results;

					// Precompiled matchers will still verify ancestry, so step up a level
					} else if ( compiled ) {
						context = context.parentNode;
					}

					selector = selector.slice( tokens.shift().value.length );
				}

				// Fetch a seed set for right-to-left matching
				i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
				while ( i-- ) {
					token = tokens[i];

					// Abort if we hit a combinator
					if ( Expr.relative[ (type = token.type) ] ) {
						break;
					}
					if ( (find = Expr.find[ type ]) ) {
						// Search, expanding context for leading sibling combinators
						if ( (seed = find(
							token.matches[0].replace( runescape, funescape ),
							rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
						)) ) {

							// If seed is empty or no tokens remain, we can return early
							tokens.splice( i, 1 );
							selector = seed.length && toSelector( tokens );
							if ( !selector ) {
								push.apply( results, seed );
								return results;
							}

							break;
						}
					}
				}
			}

			// Compile and execute a filtering function if one is not provided
			// Provide `match` to avoid retokenization if we modified the selector above
			( compiled || compile( selector, match ) )(
				seed,
				context,
				!documentIsHTML,
				results,
				!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
			);
			return results;
		};

		// One-time assignments

		// Sort stability
		support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

		// Support: Chrome 14-35+
		// Always assume duplicates if they aren't passed to the comparison function
		support.detectDuplicates = !!hasDuplicate;

		// Initialize against the default document
		setDocument();

		// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
		// Detached nodes confoundingly follow *each other*
		support.sortDetached = assert(function( el ) {
			// Should return 1, but returns 4 (following)
			return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
		});

		// Support: IE<8
		// Prevent attribute/property "interpolation"
		// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
		if ( !assert(function( el ) {
			el.innerHTML = "<a href='#'></a>";
			return el.firstChild.getAttribute("href") === "#" ;
		}) ) {
			addHandle( "type|href|height|width", function( elem, name, isXML ) {
				if ( !isXML ) {
					return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
				}
			});
		}

		// Support: IE<9
		// Use defaultValue in place of getAttribute("value")
		if ( !support.attributes || !assert(function( el ) {
			el.innerHTML = "<input/>";
			el.firstChild.setAttribute( "value", "" );
			return el.firstChild.getAttribute( "value" ) === "";
		}) ) {
			addHandle( "value", function( elem, name, isXML ) {
				if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
					return elem.defaultValue;
				}
			});
		}

		// Support: IE<9
		// Use getAttributeNode to fetch booleans when getAttribute lies
		if ( !assert(function( el ) {
			return el.getAttribute("disabled") == null;
		}) ) {
			addHandle( booleans, function( elem, name, isXML ) {
				var val;
				if ( !isXML ) {
					return elem[ name ] === true ? name.toLowerCase() :
							(val = elem.getAttributeNode( name )) && val.specified ?
							val.value :
						null;
				}
			});
		}
		return Sizzle
	})(window);

	Vessel.sizzle = sizzle
	Vessel.unique = sizzle.uniqueSort
}(window)

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
		if (!selector) {
			return this
		} else if (lang.isString(selector)) {
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
		} else if (selector && selector.nodeType || selector === window) {
			// 这边是处理 Vessel(DOMNode) 的情况
			first = this
			second = [selector]
		} else if (lang.isFunction(selector)) {
			// 这边是处理 Vessel(fn) 的情况
			context = context || window
			return selector.call(context)
		} else {
			second = []
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
		proto = Vessel.prototype,
		support = Vessel.browser.support

		// 为支持一些标签而额外添加的包裹
		// 有了这些包裹，使用 innerHTML 的时候才能正确创建所有节点
		// 前面的数字表示外部有多少层，取的时候要取多少次子节点
	var htmlWrap = {
			__default__: support.htmlLink ? [0, '', ''] : [1, 'v<div>', '</div>'],
			option: [1, '<select multiple="multiple">', '</select>'],
			legend: [1, '<fieldset>', '</fieldset>'],
			area: [1, '<map>', '</map>'],
			// Support for IE9-
			param: [1, '<object>', '</object>'],
			thead: [1, '<table>', '</table>'],
			tr: [2, '<table><tbody>', '</tbody></table>'],
			col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
			td: [3, '<table><tbody><tr>', '</tr></tbody></table>']
		},
		// 非 ie9- 兼容的 html 标签
		nodeNames = 'abbr|article|aside|audio|bdi|canvas|data|datalist|details|dialog|figcaption|figure|footer|header|hgroup|main|mark|meter|nav|output|picture|progress|section|summary|template|time|video',
		// 用来闭合 xHTML 的标签
		// 当然，例如 <br/><img/>等 这些是符合标准的，不需要进行闭合处理
		xhtmlTagFixReg = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,
		leadingWhitespaceReg = /^\s+/,
		// 判断是否含有html标签的正则，主要用于处理在 html() 的时候是否创建文本节点
		hasTagReg = /<|&#?\w+;/,
		tagNameReg = /<([\w:-]+)/,
		// 判断是否含有 tbody
		tbodyReg = /<tbody/i,
		getText, getAll, cleanUp

	// Support for IE9-
	htmlWrap.optgrou = htmlWrap.option
	htmlWrap.tbody = htmlWrap.tfoot = htmlWrap.colgroup = htmlWrap.caption = htmlWrap.thead
	htmlWrap.th = htmlWrap.td

	// 获取节点的文本内容(内部函数)
	// 虽然这里可以使用 innerText || textContent 完成
	// 但似乎每个浏览器出来的内容不是那么统一
	// 并且，这里面不会包括 特殊标签的内容，例如 script style 等
	// 为了保证统一性和扩展性，所以自写了一个函数
	getText = function(node) {
		var nodeType = node.nodeType,
			res = ''
		if (nodeType === 1 ||
			nodeType === 9 ||
			nodeType === 11) {
			if (lang.isString(node.textContent)) {
				return node.textContent
			} else {
				for (node = node.firstChild; node; node = node.nextSibling) {
					res += getText(node)
				}
			}
		} else if (nodeType === 3 || nodeType === 4) {
			return node.nodeValue
		}
		return res
	}

	// 获取 context 所有的子节点，包括子节点的子节点
	getAll = function(context, tag) {
		var elems, elem,
			i = 0,
			res = context.getElementsByTagName ?
					context.getElementsByTagName(tag || '*') :
					context.querySelectorAll ?
					context.querySelectorAll(tag || '*') :
					undefined
		// 当没有两个方法提供元素查找的时候
		// 防止有些浏览器对某些元素不提供这些查找元素的方法
		if (!res) {
			res = []
			elems = context.childNodes || context
			for (; null != (elem = elems[i]); ++i) {
				// 当没有标签限制或者符合当前标签名的时候，加入
				if (!tag || lang.tagName(elem, tag)) {
					res.push(elem)
				} else {
					// 这里需要递归，当限制某一个标签而当前标签又不符合的时候
					// 因为 childNodes 只查当前元素子层
					lang.merge(res, getAll(elem, tag))
				}
			}
		}

		return tag === undefined || tag && lang.tagName(context, tag) ?
				// 如果当前的元素也符合条件，那么也要并入
				lang.merge([context], res) :
				res
	}

	// 清理掉元素相关的内容，包括动画，包括绑定事件等其他内容
	// 待事件绑定完成之后补全
	cleanUp = function(nodes) {
		return
	}

	// 遍历每一个元素，并执行 fn 函数
	// fn 可接受两个参数，第一个表示序号，第二个表示这个元素
	// 其中 this 也表示这个元素
	proto.each = function(fn, onlyElem) {
		return lang.each(this, function(k, v) {
			onlyElem ? v.nodeType && fn.call(v, k, v) : fn.call(v, k, v)
		})
	}

	// 遍历每一个元素，并执行 fn 函数
	// 最终返回包含所有执行结果的数组
	proto.map = function(fn) {
		return lang.map(this, fn)
	}

	// 获取匹配的元素集合中第一个元素的 文本内容
	// 或设置匹配的元素集合中每个元素的 文本内容
	proto.text = function(value) {
		var node = this[0]
		return lang.isset(value) ? this.empty().append(
			// 这里创建了一个文本节点，然后用 append 的方式加入
			(node && node.ownerDocument || document).createTextNode(value)
		) : getText(node)
	}

	// 获取匹配的元素集合中第一个元素的 innerHTML
	// 或设置匹配的元素集合中每个元素的 innerHTML
	proto.html = function(value) {
		var node = this[0]
		// 这里要对 value 进行判断
		return lang.isset(value) ? this.empty().append(value) : node.innerHTML
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
		},
		// 创建一个框架
		createFragment = function(doc) {
			doc = doc || document
			var nodeNameGroup = nodeNames.split('|'),
				frag = doc.createDocumentFragment(),
				len = nodeNameGroup.length

			if (frag.createElement) {
				while (len--) {
					frag.createElement(nodeNameGroup[len])
				}
			}
			return frag
		},
		// 将传入内容转换成Dom节点列表
		toDom = function(value) {
			var type = lang.type(value),
				res = [],
				frag, div, tag, i, tbody
			if (value.nodeType) {
				if (value.nodeType !== 1 &&      // 元素节点
					value.nodeType !== 3 &&      // 文本节点
					value.nodeType !== 9 &&      // 文档节点
					value.nodeType !== 11) {     // 框架节点
					return []
				}
				return [value]
			}
			if (type === 'array' ||
				type === 'object' && lang.isArrayLike(value)) {
				return lang.map(value, function() {
					return this.nodeType ? this : undefined
				})
			}
			if (type === 'string') {
				if (!hasTagReg.test(value)) {
					return [document.createTextNode(value)]
				}
				frag = createFragment(document)
				div = frag.appendChild(document.createElement('div'))
				// 取当前最外层包裹的标签名字
				tag = (value.match(tagNameReg) || ['', ''])[1].toLowerCase()
				wrap = htmlWrap[tag] || htmlWrap.__default__

				i = wrap[0]
				div.innerHTML = wrap[1] + value.replace(xhtmlTagFixReg, '<$1></$2>') + wrap[2]

				// 这里修正了包裹外的内容，
				// 使得 div 正好等于原内容 innerHTML 之后的外层
				while (i--) {
					div = div.lastChild
				}

				// 将 IE 丢失的文档前部空格节点补上去
				if (!support.leadingWhitespace &&
					leadingWhitespaceReg.test(value)) {
					res.push(document.createTextNode(
						value.match(leadingWhitespaceReg)[0]
					))
				}

				// 移除 IE 自动添加的 tbody(因为我们只要使用到其中的内容)
				if (!support.htmlTbody) {
					value = tag === 'table' && !tbodyReg.test(value) ?
							div.firstChild :
							wrap[1] === '<table>' && !tbodyReg.test(value) ?
							div :
							0
					i = value && value.childNodes.length
					while (i--) {
						tbody = value.childNodes[i]
						if (lang.tagName(tbody, 'tbody') && !tbody.childNodes.length) {
							valye.removeChild(tbody)
						}
					}
				}

				lang.merge(res, div.childNodes)
				// 下面是一些清理工作
				// 这样创建下来的div是可能会有父亲节点的，所以要移除
				div.textContent = '';
				// 老的IE下是需要这样移除的
				while (div.firstChild) {
					div.removeChild(div.firstChild)
				}

				div = frag.lastChild
				if (div) {
					frag.removeChild(div)
				}
				div = null

				return res
			}
		}

	// 在元素末尾增加指定的内容
	proto.append = function(value) {
		var value = toDom(value),
			target

		return this.each(function() {
			target = this
			lang.each(value, function() {
				fixTableTarget(target, this).appendChild(
					this.cloneNode(true)
				)
			})
		}, true)
	}

	// 在元素开头增加指定的内容
	proto.prepend = function(value) {
		var value = toDom(value),
			target, before
		return this.each(function() {
			target = this
			before = target.firstChild
			lang.each(value, function() {
				fixTableTarget(target, this).insertBefore(
					this.cloneNode(true),
					before
				)
			})
		}, true)
	}

	// 在被选元素前插入指定的内容
	proto.before = function(value) {
		var value = toDom(value),
			target
		return this.each(function() {
			target = this
			target.parentNode && lang.each(value, function() {
				target.parentNode.insertBefore(
					this.cloneNode(true),
					target
				)
			})
		}, true)
	}

	// 在被选元素后插入指定的内容
	proto.after = function(value) {
		var value = toDom(value),
			target
		return this.each(function() {
			target = this
			target.parentNode && lang.each(value, function() {
				target.parentNode.insertBefore(
					this.cloneNode(true),
					target.nextSibling
				)
			})
		}, true)
	}

	// 移除节点
	// 这里需要注意的是要移除和它相关的任何缓存或者事件
	// 防止出现内存泄漏
	proto.remove = function() {
		// 临时代码
		this.each(function() {
			if (this && this.parentNode) {
				cleanUp(getAll(this))
				this.parentNode.removeChild(this)
			}
		}, true)
		return
	}

	// 清空子节点
	// 这里需要注意的是要移除和它相关的任何缓存或者事件
	// 防止出现内存泄漏
	proto.empty = function() {
		var i = 0,
			elem
		for (; null != (elem = this[i]); ++i) {
			// 防止内存泄漏或者报错，要移除内部所有未完成动画以及绑定事件
			if (elem.nodeType === 1) {
				cleanUp(getAll(elem))
			}
			// 移除所有子节点
			while (elem.firstChild) {
				elem.removeChild(elem.firstChild)
			}
			// IE9- 当移除 select 里面的选项时，它内部的长度不正确的问题
			if (elem.options && lang.tagName(elem, 'select')) {
				elem.options.length = 0;
			}
		}
		return this
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
		}, true)
	}

	// 获取或设置某属性
	proto.attr = function(key, value) {
		// 临时代码
		if (lang.isString(key)) {
			if (lang.isString(value)) {
				return this.each(function() {
					this.setAttribute(key, value)
				}, true)
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
		}, true)
	}

	// 获取匹配的元素集合中第一个元素的当前值
	// 或设置匹配的元素集合中每个元素的值
	proto.val = function(value) {
		return lang.isString(value) || lang.isNumber(value) ? this.each(function() {
				this.value = value
			}, true) : this[0] && this[0].value
	}
}()

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
		return lang.isset(this.data[key])
	}
	// 批量设置值
	proto.set = function(param, value) {
		var o = {}
		if (lang.isString(param) && lang.isset(value)) {
			// 如果传入的是 key => value 形式就进行转化
			o[param] = value
			param = o
		}
		set.call(this, param)
		return this.run()
	}
	// 获取某个值
	// 缺省 key 的话会返回所有值
	proto.get = function(key, byRefer) {
		var data = this.data,
			part = lang.isset(key) ? key.split('.') : [],
			len = part.length,
			i = 0
		for (; i < len; ++i) {
			if (!lang.isset(data[part[i]])) return
			data = data[part[i]]
		}
		return byRefer ? data : lang.clone(data)
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

/**
 * easing.js
 * 过渡时的变换函数，传入一个进度，返回变换后的进度
 * owner: rusherwang
 * create: 2016-8-10
 */
!function() {
	var pow = Math.pow,
		sqrt = Math.sqrt,
		sin = Math.sin,
		cos = Math.cos,
		PI = Math.PI,
		// 用来修正指数加速情况下起始时的进度
		c0 = 1 / 1024,
		bounceOut,
		easeMaker,
		easing

	// 模拟的小球掉落的弹跳运动
	bounceOut = function(x) {
		if (x < 1 / 2.75) {
			return 7.5625 * x * x;
		} else if (x < 2 / 2.75) {
			x -= 1.5 / 2.75
			return 7.5625 * x * x + .75;
		} else if (x < 2.5 / 2.75) {
			x -= 2.25 / 2.75
			return 7.5625 * x * x + .9375;
		} else {
			x -= 2.625 / 2.75
			return 7.5625 * x * x + .984375;
		}
	}
	
	// 用来生成对应曲线
	easeMaker = {
		// 幂加速
		rateIn: function(modify) {
			return function(x) {
				return pow(x, modify)
			}
		},
		// 幂减速
		rateOut: function(modify) {
			return function(x) {
				return 1 - pow(1 - x, modify)
			}
		},
		// 幂加速减速
		rateInOut: function(modify) {
			return function(x) {
				x /= .5
				return x < 1 ?
					pow(x, modify) / 2 :
					1 - pow(-x + 2, modify) / 2
			}
		},
		// 回退加速
		backIn: function(modify) {
			var c1, c3
			// 1.70158是用来修正速度为二次函数变化的数，主要是用 进度-10% 的情况下算出来的
			// 类似于 拉弓(10%)=>放弓 时候的箭的横向运动的情况
			// -(4 * x^3) / (27 * (x + 1)^2) = -1 / 10
			// 算出来之后是 1.70154 
			// 实际上这里采用了-10.000x% 的值，为了使只保留6位小数时更精确
			c1 = modify || 1.70158
			c3 = c1 + 1
			return function(x) {
				return c3 * x * x * x - c1 * x * x
			}
		},
		// 回退减速
		backOut: function(modify) {
			var c1, c3
			c1 = modify || 1.70158
			c3 = c1 + 1
			return function(x) {
				return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2)
			}
		},
		// 回退加速减速
		backInOut: function(modify) {
			var c1, c2, c3
			c1 = modify || 1.70158
			// 因为 easeInOutBack 是将 easeInBack 和 easeOutBack 分别取一半
			// 所以，是用 进度-20% 的情况算出来
			// -(4 * x^3) / (27 * (x + 1)^2) = -2 / 10
			// 算出来之后是 2.59239 (实际上这里采用了-10.000x * 2%)
			// 正好是原来的 1.525 倍
			c2 = c1 * 1.525
			c3 = c2 + 1
			return function(x) {
				x /= .5
				return x < 1 ?
					(x * x * (c3 * x - c2)) / 2 :
					(pow(x - 2, 2) * (c3 * (x - 2) + c2) + 2) / 2
			}
		},
		// 弹性加速，modify为运动结束前弹的次数
		// 如果次数为小数则会取整数次
		elasticIn: function(modify) {
			var c4
			// c4 为一次震动的周期
			c4 = modify < 1 ? 4 / 3 : 4 / (2 * ~~modify + 1)
			return function(x) {
				if (x === 0 || x === 1) return x
				x -= 1
				return -pow(2, 10 * x) * sin((x - c4 / 4) * 2 * PI / c4)
			}
		},
		// 弹性减速，modify为运动结束前弹的次数
		elasticOut: function(modify) {
			var c4
			c4 = modify < 1 ? 4 / 3 : 4 / (2 * ~~modify + 1)
			return function(x) {
				return x === 0 || x === 1 ? 
						x :
						pow(2, -10 * x) * sin((x - c4 / 4) * 2 * PI / c4) + 1
			}
		},
		elasticInOut: function(modify) {
			var c4
			c4 = modify < 1 ? 4 / 3 : 4 / (2 * ~~modify + 1)
			return function(x) {
				if (x === 0 || x === 1) return x
				x = (x / .5) - 1
				return x < 0 ?
					-pow(2, 10 * x) * sin((x - c4 / 4) * 2 * PI / c4) / 2 :
					pow(2, -10 * x) * sin((x - c4 / 4) * 2 * PI / c4) / 2 + 1
			}
		}
	}

	easing = {
		// 暴露构造器以提供多样化需求
		maker: easeMaker,
		// 默认效果
		__default__: 'easeQuadOut',
		ease: function(x) {
			return Vessel.easing[Vessel.easing.__default__](x)
		},
		// 匀加速运动
		easeQuadIn: function() {
			return easeMaker.rateIn(2)
		}(),
		// 匀减速运动
		easeQuadOut: function() {
			return easeMaker.rateOut(2)
		}(),
		// 先匀加速，再匀减速
		easeQuadInOut: function() {
			return easeMaker.rateInOut(2)
		}(),
		easeCubicIn: function() {
			return easeMaker.rateIn(3)
		}(),
		easeCubicOut: function() {
			return easeMaker.rateOut(3)
		}(),
		easeCubicInOut: function() {
			return easeMaker.rateInOut(3)
		}(),
		// 变加速运动，速度与 sin(PI / 2 * x) 相关
		// f(v) = PI / 2 * sin(PI / 2 * x)
		easeSineIn: function(x) {
			return 1 - cos(x * PI / 2)
		},
		// 变减速运动，速度与 cos(PI / 2 * x) 相关
		// f(v) = PI / 2 * cos(PI / 2 * x)
		easeSineOut: function(x) {
			return sin(x * PI / 2)
		},
		// 先变加速，再变减速运动，速度与 sin(PI * x) 相关
		// f(v) = PI / 2 * sin(PI * x)
		easeSineInOut: function(x) {
			return -(cos(PI * x) - 1) / 2
		},
		// 变加速，总进度与指数相关
		// 理论上进度为 2 ^ (10 * x - 10)
		// 但其实上对 2 ^ (10 * (x - 1)) - 0.001 = 0 求解，得到
		// x = 1 - ln(1000) / (10 * ln(2)) = 0.00342
		// 也就是说在运动开始时，可能会有一段极小的跳动(0.00234%)
		// 这个极小的跳动在运动速度很小的时候(刚开始)是非常明显的
		// 所以将误差移动到末尾, 用 2 ^ (-10) 修正
		easeExponentialIn: function(x) {
			return x === 0 ? 0 : pow(2, 10 * (x - 1)) - c0
		},
		// 变减速，总进度与指数相关
		// 虽然也会遇到误差，但由于发生在运动结尾
		// 那一段误差存在末尾是可以被允许的
		easeExponentialOut: function(x) {
			return x === 1 ? 1 : 1 - pow(2, -10 * x)
		},
		// 先变加速再变减速，总进度与指数相关
		// 在运动开始时还是做了误差修正
		easeExponentialInOut: function(x) {
			x /= .5
			return x === 2 ? 1 : x < 1 ?
				(pow(2, 10 * (x - 1)) - c0) / 2 :
				1 - pow(2, 10 * (1 - x)) / 2
		},
		// 变加速，总进度为 圆心在(0 ,1)，半径为 1 的圆弧在 y 轴上的映射
		easeCircleIn: function(x) {
			return 1 - sqrt(1 - x * x)
		},
		// 变减速，总进度为 圆心在(1 ,0)，半径为 1 的圆弧在 y 轴上的映射
		easeCircleOut: function(x) {
			return sqrt(1 - pow(x - 1, 2))
		},
		// 先变加速再变减速，总进度与圆弧的映射相关
		easeCircleInOut: function(x) {
			x /= .5
			return x < 1 ?
				(1 - sqrt(1 - x * x)) / 2 :
				(sqrt(1 - pow(-x + 2, 2)) + 1) / 2
		},
		// 先走至 -10%，再以加速方式走至 100%
		easeBackIn: function() {
			return easeMaker.backIn()
		}(),
		// 先走至 110%，再以加速方式走至 100%
		easeBackOut: function() {
			return easeMaker.backOut()
		}(),
		// 先以减速方式走至 -10%，再以加速方式走至 50%
		// 再以减速方式走至 110&，再以加速方式走至 100%
		easeBackInOut: function() {
			return easeMaker.backInOut()
		}(),
		// 是 BounceOut 的轴对称图形
		easeBounceIn: function(x) {
			return 1 - bounceOut(1 - x)
		},
		// 弹跳运动（地面与球同为刚体）
		easeBounceOut: bounceOut,
		easeBounceInOut: function(x) {
			x /= .5
			return x < 1 ?
				(1 - bounceOut(1 - x)) / 2 :
				(1 + bounceOut(x - 1)) / 2
		},
		// 弹性运动 3 次停止
		easeElasticIn: function() {
			return easeMaker.elasticIn(3)
		}(),
		easeElasticOut: function() {
			return easeMaker.elasticOut(3)
		}(),
		easeElasticInOut: function() {
			return easeMaker.elasticInOut(3)
		}()
	}

	Vessel.extend('easing', easing)
}()

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
			animationIterationCount: true,
			columnCount: true,
			flexGrow: true,
			flexShrink: true,
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
		getStyles, curCSS,                // 获取样式相关
		devideStyle,                      // 获取单位相关
		cssHooks,                         // 样式钩子
		css,                              // 样式属性的入口
		animate,                          // 动画入口
		stop,                             // 动画终止入口
		Tween, TweenProto,                // 动画队列相关
		raf, caf, line, interval, lineRun // 队列执行相关

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
				if (value <= 0 || !lang.isset(value)) {
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
		if (!lang.isset(value)) {
			// 如果没有 value 那就是需要进行获取
			// 这里使用了钩子的方式获取兼容，可以让兼容代码和操作代码分离
			// 利于后期的维护
			return (cssHooks[key] && cssHooks[key].get ? cssHooks[key] : cssHooks['default']).get(this[0], key)
		} else {
			if (needRunReg.test(value)) {
				needRun = true
			} else {
				if (!lang.empty(value) && lang.isNumber(+value)) {
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
					if (!lang.empty(value) && lang.isNumber(+calcValue)) {
						calcValue += cssOnlyNumber[key] ? '' : 'px'
					}
				}
				;(hook && hook.set ? hook : cssHooks['default']).set(this, key, calcValue)
			})
			return this
		}
	}

	animateHooks = {
		// 无需兼容的情况
		'default': {
			get: function(elem, prop, end) {
				var start, end

				elem = [elem]
				start = css.call(elem, prop)
				css.call(elem, prop, end)
				end = css.call(elem, prop)
				css.call(elem, prop, start)

				return [start === 'auto' ? '' : start, end]
			},
			calc: function(value) {
				return Math.round(value * 100) / 100
			},
			set: function(elem, prop, value) {
				css.call([elem], prop, value)
			}
		}
	}

	// 颜色相关兼容
	var colorPickReg = /#([\da-fA-F]{3,6})/,
		// 这里匹配了十六进制可能的颜色值
		colorExchangeReg = /[\da-fA-F]{2}/g
	lang.each([
		'color',
		'background',
		'backgroundColor',
		'textShadow',
		'boxShadow'], function(i, key) {
			!animateHooks[key] && (animateHooks[key] = {})
			animateHooks[key].calc = function(value) {
				// 在色值取值外的内容要进行舍去，不然会导致渐变错误
				return value < .5 ? 0 : value >= 254.5 ? 255 : Math.round(value)
			}
			!cssHooks[key] && (cssHooks[key] = {})
			cssHooks[key].get = function(elem, key) {
				var style = curCSS(elem, key),
					color, cell
				style = style ? style : elem.style[key]
				
				// Fix IE(7-9) Bug
				// background:#333 => 
				//      css('background') = ''
				//      css('background-color') = '#333'
				// 如果没有值，那么尝试从后缀为 -color 的值中进行搜索
				if (style === '') {
					style = curCSS(elem, key + '-color')
					style = style ? style : elem.style[key + '-color']
				}

				color = style.match(colorPickReg)
				if (color && color[1]) {
					cell = color[1]
					// 将 #abc 转化成 #aabbcc 形式
					if (cell.length === 3) {
						cell = cell.replace(/\d/g, function(c) {
							return c + c
						})
					}
					// 将 #xxxxxx 转化成 rgb(xx,xx,xx) 形式
					cell = cell.replace(colorExchangeReg,
						function(c) {
							return ',' + lang.parse(c, 16, 10)
						}
					)
					style = 'rgb(' + cell.substring(1) + ')'
				}

				return style
			}
		}
	)

	// 滚动条相关兼容
	lang.each({
		scrollTop: 'pageYOffset',
		scrollLeft: 'pageXOffset'
	}, function(key, v) {
		var docEle = document.documentElement
		animateHooks[key] = {
			get: function(elem, prop, end) {
				return [
					!elem.parentNode ? 
						docEle[prop] || window[v] || document.body[prop] || 0 :
						elem[prop],
					end
				]
			},
			calc: function(value) {
				return ~~Math.round(value)
			},
			set: function() {
				// 这边将判断写在了外面，这样可以在执行的时候少判断一次
				if (lang.strstr('Y', v)) {
					return function(elem, prop, value) {
						if (elem.parentNode) {
							elem[prop] = value
						} else {
							window.scrollTo(0, value)
						}
					}
				} else {
					return function(elem, prop, value) {
						if (elem.parentNode) {
							elem[prop] = value
						} else {
							window.scrollTo(value, 0)
						}
					}
				}
			}()
		}
	})
	
	// 初始化，生成一个计算好的可以被单独执行的动画对象
	Tween = function(elem, prop, end, duration, easing, callback) {
		return new Tween.prototype.init(
			elem,       // 相关元素
			prop,       // 相关属性
			end,        // 动画结束时候的位置
			duration,   // 动画持续时间
			easing,     // 过渡效果
			callback    // 动画执行结束后回调函数
		)
	}

	TweenProto = Tween.prototype = {
		constructor: Tween,
		init: function(elem, prop, end, duration, easing, callback) {
			var hook = animateHooks[cssKeyFix(prop)] || {},
				duration = +duration || 1000,
				res, devide

			this.elem = elem
			this.prop = prop

			// 初始化 获取 计算 和 设置 的方法
			!hook.get && (hook.get = animateHooks['default']['get'])
			!hook.calc && (hook.calc = animateHooks['default']['calc'])
			!hook.set && (hook.set = animateHooks['default']['set'])

			res = hook.get(elem, prop, end)

			devide = devideStyle(res[0], res[1])
			if (devide === false) {
				// 如果是无法解析和无法匹配的开始和结束帧，就提示并退出
				if (typeof console === 'object') {
					console.warn('Set\n')
					console.warn(elem)
					console.warn('CSS style "' + prop + '" to "' + end + '" failed so that animate won\'t effect.')
				}
				this.cancel = true
				return
			} else {
				// 拼接前后的内容
				this.leftSide = devide[0][0]
				this.rightSide = devide[0][1]
				// 以数组方式提供起始和结束
				// 当他们的长度大于1时，在计算完成之后会用逗号相隔
				this.start = devide[1]
				this.end = devide[2]
			}

			// 当开始和结束相同时，这次的动画不必进行
			if (this.start === this.end) {
				this.cancel = true
				return
			}

			this.duration = duration
			this.startTime = +new Date
			this.callback = callback

			// 过渡时候用到的函数
			this.easing = lang.isFunction(easing) ? 
							easing :
							Vessel.easing[easing]
			this.easing = !this.easing ? Vessel.easing.ease : this.easing

			this.handle = hook
			return this
		},
		run: function(index) {
			var now = +new Date,
				rate = (now - this.startTime) / this.duration,
				len = this.start.length,
				calcValue = [],
				from, to

			if (rate >= 1) {
				this.stop = 2
				rate = 1
			} else {
				rate = this.easing(rate)
			}

			// 这里将过渡用到的数字进行进度计算
			if (this.stop !== 1) {
				while (len--) {
					from = this.start[len]
					to = this.end[len]
					calcValue[len] = this.handle.calc((to - from) * rate + from)
				}

				this.handle.set(
					this.elem,
					this.prop,
					this.leftSide + calcValue.join(',') + this.rightSide
				)
			}

			if (this.stop) {
				if (this.stop === 2) {
					this.callback && (this.callback(this.elem))
				}
				// 置空，防止内存泄漏
				this.elem = null
				line.splice(index, 1)
			}
		}
	}
	TweenProto.init.prototype = TweenProto

	line = []
	lineRun = function() {
		var len = line.length,
			needStop = !lang.empty(stopList)
		// 每个单独执行
		while (len--) {
			if (needStop && lang.isset(stopList[len])) {
				// 1 代表动画立即结束并停留在当前位置
				// 2 代表动画立即结束并置于动画末尾
				line[len]['stop'] = stopList[len] === true ? 2 : 1
			}
			line[len] && line[len].run(len)
		}
		needStop && (stopList = {})
		line.length === 0 && caf(interval)
	}
	
	// 动画每帧执行调用入口
	if (window.requestAnimationFrame &&
		window.cancelAnimationFrame) {
		// 如果有 HTML5 提供的动画接口，就使用它
		// 这个可以保证每次计算的帧都会被 Paint 
		raf = function (init) {
			// 这里因为 window.requestAnimationFrame 会传入 keyFrame 的数字
			// 但是有些旧版的浏览器却不会传
			// 所以用 true 表示初始化
			if (init === true) {
				interval = window.requestAnimationFrame(raf)
			} else if (interval) {
				// 为了防止 interval 增加过快，这里就不进行更新了
				// 当要停止的时候 interval = null，也可以阻止递归继续
				window.requestAnimationFrame(raf)
				lineRun()
			}
		}
		caf = function(id) {
			window.cancelAnimationFrame(id)
			interval = null
		}
	} else {
		raf = function() {
			// 如果不支持 raf, 就构造一个类似的函数
			// 该函数按照每秒 60 帧的方式执行，但是中间可能会因为性能漏掉 Paint
			// 所以实际上会小于每秒 60 帧
			// 不再继续提高帧数的原因也和上述有关
			// 浏览器优化可能会尽量减少 Paint，导致大量掉帧
			interval = setInterval(lineRun, 16.7)
		}
		caf = function(id) {
			clearInterval(id)
			interval = null
		}
	}

	animate = function(prop, end, duration, easing, callback) {
		return prop && this.each(function() {
			// 将动画加入队列中
			tween = Tween(this, prop, end, duration, easing, callback)
			!tween.cancel && line.push(tween) && !interval && raf(true)
		})
	}

	var stopList = {}
	stop = function(toEnd) {
		return this.each(function(k, v) {
			// 将动画移除队列
			lang.each(line, function(i) {
				this.elem === v && (stopList[i] = !!toEnd)
			})
		})
	}

	Vessel.fn
		.extend('css', css)
		.extend('animate', animate)
		.extend('stop', stop)
}(window)
