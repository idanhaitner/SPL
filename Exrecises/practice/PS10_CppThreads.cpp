/*
 * SPL practice — PS10, C++ threads
 * Slides: Exrecises/SPL_PS10.pptx
 *
 * The Java half of this session (NIO, STOMP, thread-per-client) is
 * PS10_NioAndStomp.java.
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS10_CppThreads_solution.cpp — try before you open it.
 *
 * From this folder:
 *   g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS10_CppThreads PS10_CppThreads.cpp && ./PS10_CppThreads
 *
 * A std::thread that is still joinable at the end of its lifetime
 * aborts the program. join() is part of the exercise, not optional.
 */

#include <functional>
#include <mutex>
#include <thread>
#include <vector>

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Thrown by every unfinished exercise. The runner turns it into a [todo] line
// instead of a crash, so you can run the file after filling in just one task.
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
        std::cout << "\n" << passed << " passed, " << failed << " failed, "
                  << todo << " still to do.\n";
        if (failed == 0 && todo == 0) {
            std::cout << "All exercises complete. Nice work.\n";
        } else if (failed == 0 && passed == 0) {
            std::cout << "Every exercise is still open. Fill one in and run again.\n";
        } else if (failed == 0) {
            std::cout << "The finished ones are correct. Fill in each [todo].\n";
        }
        return failed == 0 ? 0 : 1;
    }
};

template <class T>
void expect_eq(const std::string& label, const T& got, const T& want) {
    if (!(got == want)) {
        std::ostringstream out;
        out << label << "\n         expected: " << want << "\n         got:      " << got;
        throw std::runtime_error(out.str());
    }
}

inline void expect_true(const std::string& label, bool cond) {
    if (!cond) throw std::runtime_error(label);
}

template <class F>
void check(Score& score, const std::string& name, F fn) {
    try {
        fn();
        score.pass(name);
    } catch (const NotImplemented&) {
        score.skip(name);
    } catch (const std::exception& ex) {
        score.fail(name, ex.what());
    }
}

inline void read(const std::string& line) {
    std::cout << "  [read] " << line << "\n";
}


// Exercise 1.
// There is no Runnable type. You hand the thread a function, a lambda,
// or a method. join() waits until that function returns. Add the two
// halves of values. Take a local sum inside each thread, then add it to
// total while holding the mutex, so the shared write is one critical section.
int parallel_sum(const std::vector<int>& values) {
    throw NotImplemented("parallel_sum");
}

// Exercise 2.
// std::lock_guard locks the mutex in its constructor and unlocks it in
// its destructor. The unlock happens when the block ends, including when
// the function returns early or throws. Push `times` copies of id.
void locked_push(std::mutex& guard, std::vector<int>& out, int id, int times) {
    throw NotImplemented("locked_push");
}

// Exercise 3.
// Before a std::thread object is destroyed, you join() it or detach() it.
// This course joins, so the result is visible. Return "join".
std::string required_thread_call() {
    throw NotImplemented("join");
}

// Exercise 4.
// Java's synchronized block locks on the way in and unlocks on the way out.
// The C++ object that does the same around a mutex is std::lock_guard.
// Return "lock_guard".
std::string raii_lock_name() {
    throw NotImplemented("lock_guard");
}

int main() {
    std::cout << R"(
============================================================
PS10 — C++ threads
Slides: Exrecises/SPL_PS10.pptx
============================================================

A thread is another call stack in the same process. In C++ you build
one by naming the function it should run:

    std::thread worker(task);
    worker.join();

A lambda works in the same place. join() blocks the caller until task
returns. Forget it, and the std::thread destructor aborts the program.

std::mutex is the lock. std::lock_guard<std::mutex> is the small object
that locks in its constructor and unlocks in its destructor. That is
RAII: the resource is tied to the object's lifetime, so an early return
still unlocks.

    {
        std::lock_guard<std::mutex> lock(guard);
        // only one thread in this block
    } // destructor unlocks here

The Java half of the slides — thread-per-client, ByteBuffer.flip, and
STOMP frames — is in PS10_NioAndStomp.java.

)";

    std::mutex demo_guard;
    int demo = 0;
    {
        std::lock_guard<std::mutex> lock(demo_guard);
        demo = 1;
    }
    read("lock_guard left the mutex unlocked and demo is " + std::to_string(demo));

    std::cout << "\nExercises\n";
    Score score;

    check(score, "1. parallel_sum — two threads, one mutex, then join", [] {
        expect_eq("sum", parallel_sum(std::vector<int>{1, 2, 3, 4, 5}), 15);
        expect_eq("empty", parallel_sum(std::vector<int>{}), 0);
    });
    check(score, "2. locked_push — lock_guard around the shared vector", [] {
        std::mutex guard;
        std::vector<int> out;
        locked_push(guard, out, 7, 3);
        expect_eq("warm-up size", static_cast<int>(out.size()), 3);

        std::thread first(locked_push, std::ref(guard), std::ref(out), 1, 20);
        std::thread second(locked_push, std::ref(guard), std::ref(out), 2, 20);
        first.join();
        second.join();
        expect_eq("size", static_cast<int>(out.size()), 43);
        int ones = 0;
        int twos = 0;
        for (int value : out) {
            if (value == 1) ++ones;
            if (value == 2) ++twos;
        }
        expect_eq("id 1", ones, 20);
        expect_eq("id 2", twos, 20);
    });
    check(score, "3. what you call before a std::thread is destroyed", [] {
        expect_eq("call", required_thread_call(), std::string("join"));
    });
    check(score, "4. the RAII wrapper around std::mutex", [] {
        expect_eq("name", raii_lock_name(), std::string("lock_guard"));
    });

    return score.finish();
}
