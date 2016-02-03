@myDecorator("MY_DECORATOR")
class MyClass {

	@methodDecorator("METHOD_DECORATOR")
    myMethod(arg: string) { 
        return "Message -- " + arg;
    }
}