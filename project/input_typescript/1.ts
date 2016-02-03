@myClassDecorator("MY_DECORATOR1111")
class MyClass {

	@methodDecorator("METHOD_DECORATOR")
    myMethod(arg: string) { 
        return "Message -- " + arg;
    }
}