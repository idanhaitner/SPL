# Exercise practice

One runnable file for each practical-session deck in `materials/sessions/`. Open the file, read the short lesson, replace each `NotImplemented` line, and run it again. A line marked `[todo]` is still blank. `[pass]` means that exercise matches the session. `[fail]` means it ran and the result does not.

The finished version of each file is in `solutions/`. Try the exercise before you open it.

PS12 and PS13 are Python. Those decks teach SQL and the persistence layer, so the practice file is a Python program that runs your SQL. Every other session is C++ or Java, matching the slides. PS10 is both: Java for buffers, thread-per-client, and STOMP, and C++ for `std::thread` and `std::lock_guard`.

Run each command from this folder.

| Session | Slides | Practice file |
| --- | --- | --- |
| PS1 | `SPL_PS1 (1).pptx` | `PS01_IntroCpp.cpp` |
| PS2 | `SPL_PS2 (1).pptx` | `PS02_Memory.cpp` |
| PS3 | `SPL_PS3.pptx` | `PS03_Classes.cpp` |
| PS4 | `SPL_PS4.pptx` | `PS04_AdvancedOop.cpp` |
| PS5 | `SPL_PS5.pptx` | `PS05_GenericsDbc.java` |
| PS6 | `PS6-2026-1.pptx` | `PS06_Threads.java` |
| PS7 | `SPL_PS7.pptx` | `PS07_Synchronization.java` |
| PS8 | `SPL_PS8.pptx` | `PS08_MoreConcurrency.java` |
| PS9 | `PS9 2026.pptx` | `PS09_Sockets.java` |
| PS10 | `SPL_PS10.pptx` | `PS10_NioAndStomp.java` and `PS10_CppThreads.cpp` |
| PS11 | `SPL_PS11.pptx` | `PS11_Reactor.java` |
| PS12 | `SPL_PS12.pptx` | `PS12_SqlAndPython.py` |
| PS13 | `SPL_PS13_PRES.pptx` | `PS13_Persistence.py` |

C++:

```bash
g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS01_IntroCpp PS01_IntroCpp.cpp && ./PS01_IntroCpp
```

Java:

```bash
javac PS05_GenericsDbc.java && java PS05_GenericsDbc
```

Python:

```bash
python3 PS12_SqlAndPython.py
```

The same shape works for the other files: the comment at the top of each file has its exact command.

`./check.sh` compiles and runs every practice file. `./check.sh solutions` runs the finished copies and expects every exercise to pass.

A few of the C++ exercises allocate memory. If the program aborts after you edit one function, that function is the one to reread. The starter file does not dereference an empty or freed pointer.
