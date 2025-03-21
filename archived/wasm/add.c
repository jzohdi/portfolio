// simple.c
#include <stdint.h>

// Export this function to JavaScript
__attribute__((export_name("add"))) int add(int a, int b)
{
    return a + b;
}

// Export another function that uses memory
__attribute__((export_name("sumArray"))) int sumArray(int *array, int length)
{
    int sum = 0;
    for (int i = 0; i < length; i++)
    {
        sum += array[i];
    }
    return sum;
}
