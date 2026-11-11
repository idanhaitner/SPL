---
id: bridge-servers
title: "Review: protocols and servers"
kind: bridge
reviews: [networking, reactor, serialization]
blurb: "A look back at communication between processes: what TCP really delivers, how a server finds messages and gives them meaning, and what happens when two clients reach the same data."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

The last three chapters built a server in layers: bytes on a connection, messages found in those bytes, a protocol that gives the messages meaning, and threads that serve many clients at once. This review walks one request through all the layers, and closes the communication part of the course.

## What the connection delivers

- **TCP is a session, like a phone call.** It gives a reliable stream of bytes, in the order they were sent. See [Communication between processes](topic:networking).
- **A stream has no message boundaries.** One read returns whatever bytes have arrived so far: half a message, exactly one, or two glued together.
- **So a TCP application frames its messages,** with a delimiter such as a newline, or with a length prefix, in an encoding both sides agree on.
- **UDP is a datagram, like a letter.** There is no connection and no `accept`. A datagram arrives whole or not at all, and it may be lost or arrive out of order.

| | TCP | UDP |
| --- | --- | --- |
| Unit | A stream of bytes | Whole datagrams |
| Lost data | Sent again | Stays lost |
| Order | Kept | Not kept |
| Who finds the messages | The application | The transport layer |

:::problem id=br6-what-arrives title="What can one read return?" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
A client sends two messages, one after the other: the bytes of `add 5\n`, and then the bytes of `get\n`.

:::check id=br6-what-arrives-q1
Over TCP, which of these can the server's first `read` return?

- [x] `add 5\nget\n`
- [x] `add`
- [x] `add 5\nge`
- [ ] `get\nadd 5\n`
- [ ] `get\n`

- **The stream keeps the order,** so nothing from the second message can arrive before the whole first message.
- **The stream does not keep the boundaries.** A read can stop anywhere, and it can run past the end of a message into the next one.
:::

:::check id=br6-what-arrives-q2
The same two messages are sent as two UDP datagrams. Complete the sentences.

The server can receive {{=both, either one, or neither, in either order|always both, in the order they were sent|both, but possibly glued into one}}.

A datagram that does arrive holds {{=exactly one whole message|possibly half a message|possibly two messages}}.

To find where a message ends, the UDP server needs {{=nothing: each datagram is a message|a delimiter or a length prefix}}.

UDP hands over messages, not a stream, so there is nothing to frame. What it does not promise is that a message arrives, or that messages arrive in order.
:::

:::check id=br6-what-arrives-q3
The TCP server uses a `LineMessageEncoderDecoder`, which keeps the bytes of an unfinished message in a field. Two clients are connected. How many decoder objects does the server need?

- [ ] One. Decoding is the same for every client.
- [x] One for each client. Each connection has its own unfinished message.
- [ ] One for each message.
- [ ] None. The connection handler can call a static method.

- **The decoder has state:** the bytes collected so far. If two clients fed their bytes into one decoder, the two unfinished messages would be mixed into one.
- **It would also be shared between threads.** With a thread for each client, two threads would write the same list at once. That is the race from [Synchronization](topic:synchronization).
:::
:::

## The layers of the server

- **`MessageEncoderDecoder`** turns a message into bytes, and finds messages in a stream of bytes, one byte at a time: `decodeNextByte` returns a message when one is complete, and `null` otherwise. See [Server design and the reactor](topic:reactor).
- **`MessagingProtocol`** gives a message its meaning: `process` returns the reply, or `null` for none, and `shouldTerminate` says when the conversation is over.
- **The connection handler** ties one client to one decoder and one protocol. It feeds each byte to the decoder, passes each complete message to the protocol, and sends the encoded reply.
- **The concurrency model** decides which thread runs the handler: a single thread, a thread per client, a thread pool, or the reactor.
- **In the reactor,** one communication thread does all the I/O without blocking, a `Selector` tells it which client is ready, and a task for a worker is one message, not a whole conversation.
- **A length prefix frames any content.** The first 4 bytes hold the length *n*, and the next *n* bytes are the message. See [The command-invocation server](topic:serialization).

```java
public interface MessageEncoderDecoder<T> {
    byte[] encode(T message);
    T decodeNextByte(byte nextByte);
}

public interface MessagingProtocol<T> {
    T process(T msg);
    boolean shouldTerminate();
}
```

:::problem id=br6-prefix-in-pieces title="A length prefix in pieces" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
The server frames messages with a 4-byte length prefix, most significant byte first. Two reads bring these bytes, written here as numbers, with letters for the bytes of text:

```text
first read:    0 0 0 2 h i 0 0 0
second read:   1 !
```

:::check id=br6-prefix-in-pieces-q1
Follow `decodeNextByte` through the two reads.

During the first read, it returns a message {{=once, when the byte i arrives|once, when the fourth byte arrives|twice|never}}.

At the end of the first read, the decoder is holding {{=three of the four length bytes of the next message|a complete length of 0|nothing}}.

In the second read, the byte `1` {{=completes the length, which is 1|is the first byte of the message text|completes a message}}.

The second message is {{=one byte long: !|two bytes long: 1!|empty}}.

- **The decoder never sees reads.** It sees one byte at a time, and it keeps its place between calls in its fields.
- **That is why the split does not matter.** The length arrives as `0 0 0` in one read and `1` in the next, and the decoder puts them together.
:::

:::check id=br6-prefix-in-pieces-q2
The server is a reactor. Which thread does each job for this client?

Reading the bytes from the channel is done by {{=the communication thread|a worker thread|a new thread for this client}}.

Calling `decodeNextByte` and `process` is done by {{=a worker thread, in a task|the communication thread|the client}}.

If `process` takes ten seconds, the other clients {{=are still read from, because the communication thread is free|all wait ten seconds}}.

If `process` ran on the communication thread instead, the other clients {{=would all wait, because nothing else does I/O|would be unaffected}}.

The reactor splits the work in two. One thread does all the I/O and never blocks. The workers do the processing, which may be slow, in memory only.
:::
:::

## Commands, and data that everyone shares

- **A command is an object that runs itself on the server's data.** The client sends the object. The protocol's `process` calls `execute(data)` and sends back the result.
- **The command and its result travel as bytes,** so both must be `Serializable`. A `static` field and a `transient` field are not written. A field whose class is not serializable makes the write fail.
- **Reading builds a new object** with the same field values. It is not the object the client had.
- **Each client has its own handler, decoder, and protocol object. The data is one object, shared by all of them.**
- **The actor thread pool keeps one client's tasks in order,** and never runs two of them at once. Tasks of different clients do run at the same time, on different workers.

```java
public interface Command<T> extends Serializable {
    Serializable execute(T data);
}
```

:::problem id=br6-what-travels title="What travels, and what stays" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
The server holds one `Counter`. A client sends this command.

```java
class Counter {
    private int count = 0;
    public void add(int n) { count = count + n; }
    public int get() { return count; }
}

class Add implements Command<Counter> {
    private final int n;
    private transient String note = "from the client";
    static int created = 0;

    Add(int n) { this.n = n; created++; }

    public Serializable execute(Counter data) {
        data.add(n);
        return data.get();
    }
}
```

:::check id=br6-what-travels-q1
The client builds `new Add(5)` and sends it. What does the server have after `readObject`?

The field `n` is {{=5|0}}.

The field `note` is {{=null|"from the client"}}.

On the server, `Add.created` {{=was not changed by the read|is 1, as on the client}}.

The `Counter` {{=never travels: it is the server's object, passed to execute|is sent along with the command|must be Serializable}}.

- **An ordinary field is written.** A `transient` field is skipped and gets its default value. A `static` field belongs to the class in each JVM, not to the object.
- **The data stays on the server.** Only the command and the result cross the network, so only they must be `Serializable`.
:::

:::check id=br6-what-travels-q2
Someone adds the field `private Thread sender = Thread.currentThread();` to `Add`. What happens?

- [ ] The thread is sent to the server and continues running there.
- [x] `writeObject` throws on the client, because `Thread` is not `Serializable`.
- [ ] The field is silently skipped.
- [ ] The server's `readObject` sets the field to the server's current thread.

Everything reachable from a serializable object must itself be serializable, or be marked `transient`. A thread means nothing in another JVM, so `transient` is the right fix.
:::
:::

:::problem id=br6-two-clients-one-counter title="Two clients, one counter" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
The server is a reactor with an actor thread pool, and it holds the `Counter` from the last question, starting at 0. Clients A and B each send one `Add(1)` at the same moment.

:::check id=br6-two-clients-one-counter-q1
What does the actor thread pool promise here?

- [ ] The two commands run one after the other, because the pool runs one task at a time.
- [x] Nothing about these two: they belong to different clients, so two workers may run them at the same time.
- [ ] A's command runs first, because A connected first.
- [ ] Each command runs on the communication thread.

The pool orders the tasks of one client. Its whole purpose is to let different clients be served at once. So both workers can be inside `execute`, on the same `Counter`, together.
:::

:::check id=br6-two-clients-one-counter-q2
`Counter` has no synchronization. Both workers run `data.add(1)` at once. Which final values of `count` are possible, and which are correct?

Possible: {{=1 or 2|only 2|0, 1, or 2}}.

Correct, by the definition of a correct concurrent run: {{=only 2|1 or 2|only 1}}.

`count = count + n` is a read, an add, and a write. Both workers can read 0 and both write 1. Every serial order of the two commands ends at 2, so 1 is not a correct result.
:::

:::check id=br6-two-clients-one-counter-q3
`add` and `get` are now both `synchronized`. In one run, A and B each receive the reply 2. Is that run correct?

- [ ] Yes. The counter ended at 2, and no update was lost.
- [x] No. In every serial order, one client gets 1 and the other gets 2.
- [ ] Yes. Each method is synchronized, so every run is correct.
- [ ] No, because the counter should end at 1.

- **What happened:** A added, B added, then A read 2, and B read 2. Each call was one step, but `execute` makes two calls, and the other client's `add` ran between them.
- **Serial runs:** A then B gives the replies 1 and 2. B then A gives 2 and 1. Both clients receiving 2 is not on the list.
- **The fix is the one from [Synchronization](topic:synchronization):** make the pair one step, with a single synchronized `addAndGet` in `Counter`, or with `synchronized (data) { ... }` around both calls in `execute`.
:::
:::
