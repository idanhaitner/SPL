/*
 * SPL practice — PS4, advanced OOP
 * Slides: materials/sessions/SPL_PS4.pptx
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS04_AdvancedOop_solution.cpp — try before you open it.
 *
 * From this folder:
 *   g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS04_AdvancedOop PS04_AdvancedOop.cpp && ./PS04_AdvancedOop
 */

#include <memory>
#include <utility>
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


namespace drawing {
int area() { return 1; }
}

namespace physics {
int area() { return 42; }
}

// Exercise 1.
// Both namespaces declare area(). The scope resolution operator :: picks one.
// Return the area from namespace physics.
int physics_area() {
    throw NotImplemented("physics_area");
}

// Exercise 2.
// An rvalue reference is spelled with two ampersands.
// Return the token "&&".
std::string rvalue_reference_token() {
    throw NotImplemented("rvalue token");
}

// Exercise 3.
// The rule of five is the rule of three plus a move constructor and a
// move assignment operator. Return how many special members that is.
int rule_of_five_count() {
    throw NotImplemented("rule of five");
}

// A tiny list of strings. Copying is switched off. Moving steals the
// pointer and leaves the other list empty, which is a valid state.
// In production these two functions are noexcept. They are not marked
// noexcept here, so an unfinished exercise reports [todo] instead of
// aborting: a throw leaving a noexcept function ends the program.
class StringList {
public:
    StringList() = default;
    ~StringList() { clear(); }

    StringList(const StringList&) = delete;
    StringList& operator=(const StringList&) = delete;

    StringList(StringList&& other) : head(nullptr) {
        throw NotImplemented("StringList move constructor");
    }

    StringList& operator=(StringList&& other) {
        throw NotImplemented("StringList move assignment");
    }

    void push_front(std::string text) { head = new Node{std::move(text), head}; }

    bool empty() const { return head == nullptr; }

    std::string pop_front() {
        if (head == nullptr) throw std::runtime_error("empty list");
        Node* node = head;
        std::string text = std::move(node->data);
        head = node->next;
        delete node;
        return text;
    }

private:
    struct Node {
        std::string data;
        Node* next;
    };
    Node* head = nullptr;

    void clear() {
        while (head != nullptr) {
            Node* next = head->next;
            delete head;
            head = next;
        }
    }
};

// Exercise 6.
// auto deduces the type. auto& is a reference, so the loop can modify
// the elements. Double every value in the vector.
void double_all(std::vector<int>& values) {
    throw NotImplemented("double_all");
}

// Exercise 7.
// std::shared_ptr counts owners. The int is deleted when the count hits 0.
// Make three owners of one int and return the count.
long shared_owners() {
    throw NotImplemented("shared_owners");
}

// Exercise 8.
// std::unique_ptr has one owner. std::move transfers it. After the move
// the source is empty. Return the int the destination owns.
int moved_unique() {
    throw NotImplemented("moved_unique");
}

// Exercise 9.
// One owner, movable, deleted when that owner goes away.
// Return "unique_ptr" or "shared_ptr".
std::string one_owner_pointer() {
    throw NotImplemented("unique name");
}

// Exercise 10.
// Several owners, reference counted.
// Return "unique_ptr" or "shared_ptr".
std::string shared_owner_pointer() {
    throw NotImplemented("shared name");
}

int main() {
    std::cout << R"(
============================================================
PS4 — Advanced OOP
Slides: materials/sessions/SPL_PS4.pptx
============================================================

A namespace is a named scope. drawing::area and physics::area can
both exist. :: picks the one you mean. `using namespace` pulls a
whole namespace into the current scope, which is how two areas
become ambiguous.

An lvalue has a name you can come back to. An rvalue is a temporary.
An rvalue reference, written T&&, can bind to that temporary.
std::move does not move by itself. It casts an lvalue to an rvalue
so that a move constructor is allowed to run.

The rule of five adds two members to the rule of three:

    destructor
    copy constructor
    copy assignment
    move constructor
    move assignment

A move steals the resource and leaves the other object valid and empty.

auto asks the compiler to write the type. auto& keeps a reference,
which matters when you want to change a vector element in a loop.

    unique_ptr   one owner, move it, do not copy it
    shared_ptr   a reference count, deleted at zero

)";

    auto sample = std::make_shared<int>(5);
    auto alias = sample;
    read("two shared_ptr objects, use_count = " + std::to_string(sample.use_count()));

    StringList demo;
    demo.push_front("second");
    demo.push_front("first");
    read("list pop_front returns " + demo.pop_front());

    std::cout << "\nExercises\n";
    Score score;

    check(score, "1. physics::area — the scope resolution operator", [] {
        expect_eq("physics", physics_area(), 42);
    });
    check(score, "2. the spelling of an rvalue reference", [] {
        expect_eq("token", rvalue_reference_token(), std::string("&&"));
    });
    check(score, "3. how many special members the rule of five names", [] {
        expect_eq("count", rule_of_five_count(), 5);
    });
    check(score, "4. StringList move constructor — steal the nodes", [] {
        StringList source;
        source.push_front("b");
        source.push_front("a");
        StringList dest(std::move(source));
        expect_true("source is empty after the move", source.empty());
        expect_eq("first", dest.pop_front(), std::string("a"));
        expect_eq("second", dest.pop_front(), std::string("b"));
    });
    check(score, "5. StringList move assignment", [] {
        StringList source;
        source.push_front("new");
        StringList dest;
        dest.push_front("old");
        dest = std::move(source);
        expect_true("source is empty", source.empty());
        expect_eq("stolen", dest.pop_front(), std::string("new"));
        expect_true("nothing left from the old list", dest.empty());
    });
    check(score, "6. double_all — auto& so the loop can write", [] {
        std::vector<int> values{1, 2, 3};
        double_all(values);
        expect_eq("first", values[0], 2);
        expect_eq("last", values[2], 6);
    });
    check(score, "7. shared_ptr — three owners, one int", [] {
        expect_eq("owners", shared_owners(), 3L);
    });
    check(score, "8. unique_ptr — move the single owner", [] {
        expect_eq("value", moved_unique(), 7);
    });
    check(score, "9. the smart pointer with one owner", [] {
        expect_eq("name", one_owner_pointer(), std::string("unique_ptr"));
    });
    check(score, "10. the reference-counted smart pointer", [] {
        expect_eq("name", shared_owner_pointer(), std::string("shared_ptr"));
    });

    return score.finish();
}
