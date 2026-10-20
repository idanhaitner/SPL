#pragma once

// Tiny checker for the exercises. You do not need to modify this file.
// A task that still contains `throw NotImplemented(...)` prints [todo].
// A task that runs and returns the wrong value prints [fail].

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

struct NotImplemented : std::runtime_error {
    explicit NotImplemented(const char* exercise) : std::runtime_error(exercise) {}
};

struct Score {
    int passed = 0;
    int failed = 0;
    int todo = 0;

    void pass(const std::string& name) {
        std::cout << "  [pass] " << name << "\n";
        ++passed;
    }

    void fail(const std::string& name, const std::string& why) {
        std::cout << "  [fail] " << name << "\n         " << why << "\n";
        ++failed;
    }

    void skip(const std::string& name) {
        std::cout << "  [todo] " << name << "\n";
        ++todo;
    }

    int finish() const {
        std::cout << "\n"
                  << passed << " passed, " << failed << " failed, "
                  << todo << " still to do.\n";
        if (failed == 0 && todo == 0) {
            std::cout << "All exercises complete.\n";
        } else if (failed == 0) {
            std::cout << "Fill in each [todo], then run again.\n";
        }
        return failed == 0 ? 0 : 1;
    }
};

template <class T>
void expect_eq(const T& got, const T& want) {
    if (!(got == want)) {
        std::ostringstream out;
        out << "expected " << want << ", got " << got;
        throw std::runtime_error(out.str());
    }
}

inline void expect_true(bool cond, const char* why) {
    if (!cond) {
        throw std::runtime_error(why);
    }
}

template <class F>
void task(Score& score, const std::string& name, F fn) {
    try {
        fn();
        score.pass(name);
    } catch (const NotImplemented&) {
        score.skip(name);
    } catch (const std::exception& ex) {
        score.fail(name, ex.what());
    }
}
