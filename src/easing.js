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
        __default__: 'easeQuadOut',
        swing: function(x) {
            return Vessel.easing[Vessel.easing.__default__](x)
        },
        maker: easeMaker,
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