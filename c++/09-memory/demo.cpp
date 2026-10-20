// Lesson 9 — where values live.
// From the c++ directory:  make run LESSON=09-memory
// Addresses change every run. Compare lifetimes, not the numeric order.

#include <iostream>

int global_value = 7;

void show_regions() {
    static int stays = 0;
    int local = stays;
    int* heap = new int(10);

    std::cout << "global          " << &global_value << "\n";
    std::cout << "function static " << &stays << "\n";
    std::cout << "local           " << &local << "\n";
    std::cout << "heap            " << heap << "\n";
    std::cout << "this call's local value = " << local << "\n";

    ++stays;
    delete heap;
}

int main() {
    std::cout << "first call\n";
    show_regions();
    std::cout << "second call\n";
    show_regions();
    return 0;
}
