// Lesson 10 exercises.
// From the c++ directory:  make try LESSON=10-build

#include "check.hpp"

#include <string>

std::string stage_of_missing_main() {
    // c++ -c student.cpp succeeds. c++ -o app student.o fails.
    // Return the name of the stage that failed: "linker"
    throw NotImplemented("stage_of_missing_main");
}

std::string file_written_by_dash_c() {
    // c++ -c mathx.cpp writes one of these. Return the word "object".
    throw NotImplemented("file_written_by_dash_c");
}

int declared_later(int x);     // declaration

int uses_the_declaration() {
    return declared_later(4);
}

int declared_later(int x) {    // definition: return x + 1
    throw NotImplemented("declared_later");
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
