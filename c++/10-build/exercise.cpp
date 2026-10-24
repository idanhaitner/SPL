// =============================================================================
// Lesson 10 exercises: building (preprocessor, compiler, linker)
// =============================================================================
// What you practice: knowing which build stage produces which file and which
// error, and the difference between a DECLARATION and a DEFINITION.
//
// The pipeline, one stage at a time:
//   preprocessor   handles #include / #define       .cpp  -> expanded text
//   compiler       turns one .cpp into machine code  c++ -c x.cpp  -> x.o
//   linker         joins .o files into one program   c++ -o app a.o b.o -> app
//                  and connects each call to the one definition it uses
//
// The first two exercises are questions: return the answer as a string.
// Replace each `throw NotImplemented(...)`, then run from the c++ directory:
//     make try LESSON=10-build
// =============================================================================

#include "check.hpp"

#include <string>

// -----------------------------------------------------------------------------
// 1. stage_of_missing_main
// A student writes student.cpp with a few functions but no main().
//
//   c++ -c student.cpp          succeeds and writes student.o
//   c++ -o app student.o        FAILS: "undefined symbol: _main"
//
// Which stage reported the error?
//   returns  exactly one of: "preprocessor", "compiler", "linker"
//            (lowercase, no spaces)
//
// Think: the -c step compiled the file without a problem. Which stage is
// looking for main, and only runs in the second command?
// -----------------------------------------------------------------------------
std::string stage_of_missing_main() {
    throw NotImplemented("stage_of_missing_main");
}

// -----------------------------------------------------------------------------
// 2. file_written_by_dash_c
// `c++ -c mathx.cpp` compiles but does not link. It writes mathx.o.
//
// What kind of file is mathx.o?
//   returns  one word, lowercase: "source", "header", "object", or "executable"
// -----------------------------------------------------------------------------
std::string file_written_by_dash_c() {
    throw NotImplemented("file_written_by_dash_c");
}

// -----------------------------------------------------------------------------
// 3. declared_later
// The line below is a DECLARATION: a name, parameter types, and return type,
// with no body. It tells the compiler "this function exists somewhere".
// That is enough for uses_the_declaration() to call it before the body
// appears. A header file (.hpp) is a list of declarations like this.
// -----------------------------------------------------------------------------
int declared_later(int x);     // declaration (no body)

int uses_the_declaration() {   // given: calls the function, which works
    return declared_later(4);  // thanks to the declaration above
}

// This is the DEFINITION, the body. Write it.
//
//   x        any int
//   returns  x + 1
//
// Example:   declared_later(4) == 5
// Try it: comment out the declaration line and run make try again. Read the
// error and note which stage reports it.
int declared_later(int x) {
    throw NotImplemented("declared_later");
}

// The checker. You do not edit main.
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
