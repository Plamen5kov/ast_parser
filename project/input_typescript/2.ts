@myClassDecorator("MY_DECORATOR2222")
class MyClass {
    @log
    myMethod(arg: string) { 
        return "Message -- " + arg;
    }
}