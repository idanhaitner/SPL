export const PARTS = [
  {
    title: "Memory",
    lang: "C++",
    summary: "Where a program lives, what a pointer holds, and how an object that owns memory is copied and destroyed.",
    ids: ["run-time-environment", "memory-model", "pointers", "classes-and-objects", "rule-of-three", "rule-of-five", "inheritance"],
  },
  {
    title: "Concurrency",
    lang: "Java",
    summary: "Threads, correct results, locks, and how to wait without starving or deadlocking.",
    ids: ["concurrency", "design-by-contract", "synchronization", "waiting-and-liveness"],
  },
  {
    title: "Communication between processes",
    lang: "Java",
    summary: "Sockets and protocols, a general server, the reactor that serves many clients on one thread, and a server that runs commands.",
    ids: ["networking", "reactor", "serialization"],
  },
  {
    title: "Databases",
    lang: "SQL and Python",
    summary: "Tables, keys, and joins, then a Python persistence layer that keeps your objects in a relational database.",
    ids: ["persistence"],
  },
];
