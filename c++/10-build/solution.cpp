// Finished lesson 10. Write yours in exercise.cpp first.

#include "check.hpp"

#include <string>

std::string stage_of_missing_main() {
    return "linker";
}

std::string file_written_by_dash_c() {
    return "object";
}

int declared_later(int x);

int uses_the_declaration() {
    return declared_later(4);
}

int declared_later(int x) {
    return x + 1;
}

int main() {
    Score score;
    task(score, "a missing main fails at link time", [] {
        expect_eq(stage_of_missing_main(), std::string("linker"));
    });
    task(score, "-c writes an object file", [] {
        expect_eq(file_written_by_dash_c(), std::string("object"));
    });
    task(score, "a declaration is enough to call, the body can come later", [] {
        expect_eq(uses_the_declaration(), 5);
    });
    return score.finish();
}
