---
id: course-review
title: Course review
blurb: "The main topics, the list of design patterns, and the structure of the exam."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

This last chapter is the review at the end of the lecture notes: the main topics of the course, the list of design patterns, and the structure of the exam.

- **The main topics:** the four parts of the course, and what each one covers.
- **The design patterns:** every pattern the course built, with the chapter where it appears.
- **The exam:** its structure, its weights, and how to prepare.

## The main topics

**Memory** ([Run-time environment](topic:run-time-environment) through [Inheritance and polymorphism](topic:inheritance))

- Hardware, and the operating system.
- Models: the stack and the heap.
- Variables:
  - representation (content, address), and references,
  - definition, passing, and returning,
  - `const`.
- Objects: structure, initialization, deletion, copying, and assignment (plus the `&&` optimization).
- Inheritance and polymorphism:
  - structure, initialization, deletion, copying, and assignment,
  - how polymorphism is carried out, with dynamic and static binding.

**Concurrency** ([Threads](topic:concurrency) through [Waiting and liveness](topic:waiting-and-liveness))

- The definition of a thread.
- The invariant, preconditions, and postconditions, and the definitions of safety and correctness.
- Methods for keeping safety and correctness:
  - immutable objects, and snapshots (which require merging copies at the end),
  - synchronization: lock-based (`synchronized`, `Semaphore`, `ReaderWriter`, `CAS` used as a lock), and lock-free (`cas`),
  - optimistic try and fail.
- Waiting mechanisms: `wait` and `notify`.
- Liveness: measures, scenarios, and solutions.

**Communication** ([Communication between processes](topic:networking) through [The command-invocation server](topic:serialization))

- The services of the transport layer, and the TCP and UDP protocols.
- Designing a general server pattern (in the application layer):
  - encoding, framing, and decoding,
  - the protocol,
  - the `ConnectionHandler`,
  - concurrency: a single thread, a thread per client, a thread pool, the reactor,
  - the command-invocation server.

**Databases** ([Databases](topic:persistence))

- Designing a data model.
- SQL.
- An application that includes logic, and storage in a database.

## The design patterns

| Part | Pattern | Where |
| --- | --- | --- |
| Memory | Rule of 3 and rule of 5 | [The rule of three](topic:rule-of-three), [The rule of five](topic:rule-of-five) |
| Memory | Singleton | [Databases](topic:persistence) (the persistence layer and the repository) |
| Memory | Smart pointer | [The rule of five](topic:rule-of-five) |
| Memory | Double dispatch | [Inheritance and polymorphism](topic:inheritance) |
| Concurrency | Immutable object | [Synchronization](topic:synchronization) |
| Concurrency | Synchronized class (fully or partially) | [Synchronization](topic:synchronization) |
| Concurrency | CAS | [Synchronization](topic:synchronization) |
| Concurrency | Versioned iterator | [Synchronization](topic:synchronization) |
| Concurrency | Guarded suspension (the wait-notify pattern) | [Waiting and liveness](topic:waiting-and-liveness) |
| Concurrency | Semaphore | [Waiting and liveness](topic:waiting-and-liveness) |
| Concurrency | Reader-writer | [Waiting and liveness](topic:waiting-and-liveness) |
| Communication | BaseServer | [Server design and the reactor](topic:reactor) |
| Communication | Reactor | [Server design and the reactor](topic:reactor) |
| Communication | ActorThreadPool | [Server design and the reactor](topic:reactor) |
| Communication | Remote-command-invocation server | [The command-invocation server](topic:serialization) |
| Database | Application persistence pattern | [Databases](topic:persistence) |

The factory pattern from [Classes and objects](topic:classes-and-objects) is crossed out of the list in the notes, so it is background rather than exam material.

## The exam

**Its structure:** four questions.

| Part | Share of the exam |
| --- | --- |
| Memory | 30% |
| Concurrency | 30% |
| Communication | 30% |
| Databases | 10% |

**A recommendation for studying:**

- **Go over the material.**
- **In terms of code,** put the emphasis on the design patterns.
- **Solve exams,** most recent years first. There are exams and solutions on the course site, and the practice cards at the end of each chapter here come from them.
- **Use the course mail, and the office hours.**
