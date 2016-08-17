# Vessel
    还没有写完！还在努力中！
    快乐学习，快来工作，快来生活！
    目前进度：
     - dom.js => html, test, append, prepend ...
     - change.js => animate ...
        简易属性的动画可以适用
            V('#xx').animate('width', 400, 1000, 'easeBounceOut');
            V('#xx').animate('height', 400, 1000, Vessel.easing.maker.elasticOut(5));
            V('#xx').animate('transform', 'translate(400px,0)', 1000, 'easeBounceOut');
            V('#xx').animate('background-color', 'blue', 1000, 'easeBounceOut');
        帧数和重绘已经进行调节，动画会更加流畅
        正在努力
            1.支持
                scrollTop,
                box-shadow
            等其他属性