// Lesson 14 — virtual call, static call, and slicing.
// From the c++ directory:  make run LESSON=14-inheritance

#include <iostream>

class Filter {
public:
    virtual const char* name() const { return "filter"; }
    const char* id() const { return "filter-id"; }
    virtual ~Filter() = default;
};

class Blur : public Filter {
public:
    const char* name() const override { return "blur"; }
    const char* id() const { return "blur-id"; }
};

int main() {
    Blur blur;
    Filter* through_pointer = &blur;
    std::cout << "virtual name = " << through_pointer->name() << "\n";
    std::cout << "non-virtual id = " << through_pointer->id() << "\n";

    Filter sliced = blur;
    std::cout << "sliced name = " << sliced.name() << "\n";

    Filter* owned = new Blur();
    std::cout << "owned name = " << owned->name() << "\n";
    delete owned;     // ~Blur runs because ~Filter is virtual
    return 0;
}
