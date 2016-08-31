# Vessel
    还没有写完！还在努力中！
    快乐学习，快来工作，快来生活！
    目前进度：
     - dom.js => html, test, append, prepend ...
        完成
     - change.js => animate ...
        简易属性的动画可以适用, 包括基础 css属性、css3属性和scrollTop 等
        可以使用 .stop() 进行动画暂停
            V('#xx').animate('width', 400, 1000, 'easeBounceOut');
            V('#xx').animate('height', 400, 2000, Vessel.easing.maker.elasticOut(5));
            V('#xx').animate('transform', 'translate(400px,0)', 1000, 'easeBounceOut');
            V('#xx').animate('background-color', 'blue', 1000, 'easeBounceOut');
        帧数和重绘已经进行调节，动画会更加流畅，已做 IE6 兼容
        [Demo](http://1.rushervessel.applinzi.com/demo/easing.html)
     - event.js => 正在努力事件绑定