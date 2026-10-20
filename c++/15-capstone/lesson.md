# 15 — A stack, twice

A stack (מחסנית) of integers is the smallest class that uses the whole path. You push a value, the top is the last value you pushed, and pop removes it. The session later writes this idea again in Java as a contract. Here the point is ownership.

You will write it twice.

`IntStack` owns `int* data` from `new[]`. That means the rule of three: a destructor, a deep copy, and copy-and-swap assignment. The buffer has a capacity. `size` is how many ints are live, and it is less than or equal to the capacity. Start empty, with a null pointer. On the first `push`, allocate room for 4 ints. When a `push` finds the buffer full, allocate a larger one (double the capacity), copy the live ints, `delete[]` the old block, and then store the new value.

`VecStack` stores `std::vector<int>`. You write `push`, `pop`, and `top`. You do not write a destructor, a copy constructor, or an assignment operator. `vector` already does the rule of five. The copy test checks that the compiler-generated copy is deep: pushing onto the original leaves the copy alone.

`pop` and `top` in the tests are only called when the stack is not empty. If you want to be careful, throw `std::runtime_error` when they are called on an empty stack.

Draw one `IntStack` before you compile it:

```text
stack frame of main
  IntStack s
    data  ------+
    n = 2       |
    cap = 4     |
                v
heap:  [10, 20, ?, ?]
```

`s` dies at the end of `main`. The destructor frees the heap block. A copy of `s` has a different heap block with the same two live values. If both `data` pointers are equal, the copy is shallow, and the program is wrong even if a short test happens to print the right numbers.

## What this folder stopped short of

The C++ on the exams is the material in lessons 8 through 14: pointers, `new`/`delete`, constructors, the rule of three, move and smart pointers, and virtual calls. The study site teaches those chapters again in Hebrew, with the lecture's diagrams and the past-paper questions:

[idanhaitner.github.io/SPL](https://idanhaitner.github.io/SPL/)

Chapters 7 through 13 of the course are Java: the runtime, threads, design by contract, sockets, the Reactor, serialization, and SQL. They are not in this folder.

A few C++ tools were left out on purpose because this course does not examine them: writing your own templates, multiple inheritance, exceptions as a design method (that shows up in the Java half), and formatting streams. You did use one lambda already. The `[] { ... }` passed to `task` inside each `main` is an unnamed function. You can finish every exercise without writing one.

## Exercise

`make try LESSON=15-capstone`

Then:

```bash
make test-asan
```

Both stacks should pass, and the sanitizer should stay quiet.
