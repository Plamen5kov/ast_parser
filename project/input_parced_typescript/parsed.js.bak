var MyClass = (function (_super) {
    __extends(MyClass, _super);
    function MyClass() {
        _super.apply(this, arguments);
    }
    MyClass.prototype.MyClassMethod1 = function () {
        console.log("smth");
    };
    MyClass.prototype.MyClassMethod2 = function () {
        console.log("smth");
    };
    MyClass = __decorate([
        JavaProxy("asd.asd.As")
    ], MyClass);
    return MyClass;
})(android.view.ViewGroup);

var AnotherClass = (function (_super) {
    __extends(AnotherClass, _super);
    function AnotherClass() {
        _super.apply(this, arguments);
    }
    AnotherClass.prototype.AnotherClassMethod1 = function () {
        console.log("smth");
    };
    AnotherClass.prototype.AnotherClassMethod2 = function () {
        console.log("smth");
    };
    Object.defineProperty(AnotherClass.prototype, "AnotherClassMethod1",
        __decorate([
            MyMethodDecorator
        ], AnotherClass.prototype, "AnotherClassMethod1", Object.getOwnPropertyDescriptor(AnotherClass.prototype, "AnotherClassMethod1")));
    AnotherClass = __decorate([
        JavaProxy("aaa.bbbb.Ccc"),
        AnotherClassDecorator("dddd.eeee.Fff")
    ], AnotherClass);
    return AnotherClass;
})(android.view.Tralala);

(function () {
    var MyButton = android.widget.Button2222.extend("my.custom.ClassFromOriginalTest", {
        onClick222222: function () {
            console.log('click happened');
        },
        onClick222222222222: function () {
            console.log('click happened');
        }
    });
})();

var MyButton = android.widget.Button1111.extend("my.custom.ClassFromSubFolder", {
    onClick111111111: function () {
        console.log('click happened');
    },
    onClick111111111111111: function () {
        console.log('click happened');
    }
});