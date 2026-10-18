---
id: reactor
title: The reactor
sources:
  - "Classes/Chapter 11 - Reactor.pptx"
  - "Exrecises/SPL_PS10.pptx"
  - "Exrecises/SPL_PS11.pptx"
  - "Exams/15-a.pdf"
  - "Exams/15-a-solution.pdf"
  - "Exams/16-b.pdf"
  - "Exams/16-b-solution.pdf"
  - "Exams/17-a.pdf"
  - "Exams/17-a-solution.pdf"
  - "Exams/18-a.pdf"
  - "Exams/18-a-solution.pdf"
  - "Exams/18-b.pdf"
  - "Exams/18-b-solution.pdf"
  - "Exams/19-a.pdf"
  - "Exams/19-a-solution.pdf"
  - "Exams/19-b.pdf"
  - "Exams/19-b-solution.pdf"
  - "Exams/20-a.pdf"
  - "Exams/20-a-solution.pdf"
  - "Exams/24-a.pdf"
  - "Exams/24-a-solution.pdf"
  - "Exams/24-b.pdf"
  - "Exams/24-b-solution.pdf"
  - "Exams/24-c.pdf"
  - "Exams/24-c-solution.pdf"
---

A thread per client spends a stack on each connection and blocks inside `read` for most of its life. A single-threaded server accepts one client and ignores the others until that conversation ends. The reactor (ריאקטור) is the third shape: one thread waits for many channels, and a small pool runs the work that is actually slow.

## Three servers, then a fourth

The lecture's service returns a `BufferedImage` for a file name. The client writes the name and a newline and reads the bytes back.

A single-threaded server calls `accept`, handles that socket to the end, and only then loops. One client at a time.

A thread-per-client server calls `accept` and `new Thread(() -> handle(s)).start()`. Connections overlap. Threads are expensive, most of them are blocked in `read`, and nothing stops a million clients from creating a million threads. The lecture's row for this design: uncontrolled, collapses under load, wasteful, not scalable.

A fixed pool, `Executors.newFixedThreadPool(poolSize)`, caps the count. Extra connections wait in the queue. The threads are still blocked in I/O, so a pool of eight stuck in `read` serves nobody else.

:::definition id=def-reactor title="Reactor" source="Classes/Chapter 11 - Reactor.pptx"
An event-driven server does not give a thread to each client. One thread stays available for the short events. Further threads exist only for work that would block that loop. Non-blocking I/O means a slow client does not stop the loop from accepting someone else, and a cheap operation does not wait behind a slow disk read.
:::

The Java NIO names, from the lecture and from session 10:

- A channel replaces the socket-plus-streams pair. `SocketChannel` and `ServerSocketChannel` can be non-blocking, so `read`, `write`, and `accept` return immediately with a count, which is often 0.
- A `Selector` is the wait. A channel registers interest in `OP_ACCEPT`, `OP_READ`, or `OP_WRITE`. `select()` blocks until at least one registered channel is ready, instead of spinning on reads that return 0.
- A `SelectionKey` is one registration. `interestOps` is what you asked to hear about. `readyOps` is what happened. `selectedKeys()` is the set `select` just marked ready. You must remove a key from that set yourself; the selector does not.
- A `ByteBuffer` is the memory those reads and writes use. It has a position, a limit, and a capacity. After a write into the buffer, `flip()` sets the limit to the position and the position to 0, so the next operation reads what you just wrote. `clear()` prepares the buffer for another fill.

Session 11's bit masks: `OP_READ` is 1, `OP_WRITE` is 4, `OP_ACCEPT` is 16. Interest in read or write is `OP_READ | OP_WRITE`. A test for readability is `(ready & OP_READ) != 0`. The bits do not overlap, which is why a mask works.

![The reactor loop: one selector thread, ready keys, and a pool only for protocol work](../assets/figures/reactor-loop.svg)

:::algorithm id=alg-reactor title="Reactor loop" source="Classes/Chapter 11 - Reactor.pptx" complexity="one thread waits in select; protocol work is off that thread. A quiet server blocks in select rather than spinning" invariant="Every open channel is registered for the events the server is prepared to handle, and a key in selectedKeys is removed by the loop that handles it."
```text
selector = new Selector
register serverSocket for OP_ACCEPT
while true:
    selector.select()
    for key in selector.selectedKeys():
        remove key from the set
        if key is acceptable: accept, set non-blocking, register OP_READ
        if key is readable: read into a ByteBuffer, hand bytes to the tokenizer
        if a full message exists: submit protocol work to the pool
        if key is writable: write queued bytes, and clear OP_WRITE when the queue is empty
```
:::

Leaving `OP_WRITE` set when the queue is empty makes `select` return immediately, forever. That is the busy spin on the lecture's list of mistakes. Other mistakes on that slide: reading without a bound so buffers grow without limit, doing a heavy or blocking call on the selector thread, and calling `interestOps` from a thread that is not the selector thread. The reactor does not make the protocol correct, and it does not make a slow disk fast. It only keeps the wait off the worker threads.

Session 11 adds the actor pool. A plain pool may run message M2 of a client before M1, because they are two tasks. An actor pool has a queue per client and one active task per client, so that client's messages stay in order. A read-write lock shows up in the same session for the shared tables the protocol touches: many readers, one writer.

The connection handler in this design is not a `Runnable` per client, unlike the thread-per-client handler. It owns the buffers, the encoder-decoder, and the write queue for one channel. The selector thread calls it when the key is ready.

:::problem id=worked-flip source="Exrecises/SPL_PS10.pptx" kind=worked solution_origin=source
A `ByteBuffer` of capacity 16 has just had 5 bytes read into it. Position is 5, limit is 16. You want to write those 5 bytes to a channel. What does `flip` change?

:::solution
`flip` sets limit to 5 and position to 0. A following `channel.write(buf)` writes the five bytes. Capacity is still 16. Forgetting `flip` writes from position 5 to limit 16, which is the empty tail, and sends nothing useful. Calling `flip` twice sets limit to 0.
:::
:::

:::check id=chk-write-interest
The write queue for a channel is empty, and `OP_WRITE` is still set. What does the selector thread do?

- [ ] It blocks in `select` until the client sends a byte
- [x] It spins, because the channel is already writable
- [ ] It closes the channel

A channel with space in its send buffer is writable. `select` returns at once. The lecture calls that a busy spin. Clear `OP_WRITE` until a later read queues a reply.
:::

:::trap
`selectedKeys` is cumulative until you remove the key. Handling a key and leaving it in the set handles it again on the next iteration, often with `readyOps` already consumed.
:::

:::trap
Tokenizing and running the protocol on the selector thread is the bug behind several exam "optimizations." A slow `process` stalls `accept` for every client.
:::

## Practice

:::problem id=ps10-flip source="Exrecises/SPL_PS10.pptx" kind=exercise solution_origin=source
Session 10's buffer diagram labels position, limit, and capacity, then shows Write, Read, and Flip. Starting from a cleared buffer of capacity 8, you `put` three bytes. Give position and limit before `flip` and after `flip`. Then say which range a `write` to a channel will send.

:::hint
`clear` sets position 0 and limit equal to capacity.
:::
:::hint
`put` advances position and does not move limit.
:::
:::hint
`flip` is what turns a buffer from "I was writing" into "read what I wrote."
:::
:::solution
After `clear`: position 0, limit 8, capacity 8. After three `put`s: position 3, limit 8, capacity 8. After `flip`: position 0, limit 3, capacity 8. `channel.write` sends the bytes in `[position, limit)`, so the three bytes. The other five are outside the limit and are not sent.
:::
:::

:::problem id=ps11-actor-order source="Exrecises/SPL_PS11.pptx" kind=exercise solution_origin=source
A client sends message M1 and then M2. The server creates tasks R1 and R2. Why can a normal thread pool run R2 before R1, and what does the actor pool change?

:::hint
A pool has many workers. Two submitted tasks may start on two workers.
:::
:::hint
The session's picture is one queue per client, not one queue for the whole server.
:::
:::hint
The property you want is order for one client, not a single-threaded server.
:::
:::solution
`execute(R1)` and `execute(R2)` are two tasks. A pool with two free workers can start R2 first. Nothing in a plain pool remembers that both tasks belong to one channel.

An actor pool keeps a queue for that client and will not start R2 while R1 is still running for the same actor. Different clients still run in parallel, on the pool's threads. The selector thread only enqueues. That is why session 11 says a regular pool is not enough for a protocol that assumes in-order messages.
:::
:::

:::problem id=ps11-write-interest source="Exrecises/SPL_PS11.pptx" kind=exercise solution_origin=source
The lecture lists four mistakes. Pick the one that burns a core while no client is sending, and say the `interestOps` change that stops it.

:::hint
`select` returns immediately when any registered interest is already true.
:::
:::hint
A socket you are not currently writing is still writable if the TCP window has room.
:::
:::hint
The flag to clear is `OP_WRITE`, not `OP_READ`.
:::
:::solution
Leaving `OP_WRITE` on an idle channel is the busy spin. The channel is writable, so `select` never blocks. After the last queued byte is written, set the interest back to `OP_READ` only:

```java
key.interestOps(SelectionKey.OP_READ);
```

Set `OP_WRITE` again only when a protocol reply has been queued and `write` did not accept every byte. Do that `interestOps` call on the selector thread. The lecture lists a cross-thread `interestOps` as a separate bug.
:::
:::


:::examnote
The question edits the reactor from the appendix: move tokenization off the selector, cap work per client, add a log, or serve a database query without blocking `select`. The trap is doing the heavy call on the selector thread, or waking `select` forever by leaving `OP_WRITE` set.
:::

:::problem id=exam-15a-q3 source="Exams/15-a.pdf" kind=exam solution_origin=source
Keep the reactor, but talk to every client through one `DatagramSocketChannel` instead of a TCP `SocketChannel` per client. `send` and `receive` are non-blocking and return immediately. `receive` returns the sender's address, or null if nothing arrived.

a. (20) Say which methods you change. Do not rewrite methods you leave alone.
b. Name one advantage and one disadvantage of UDP here. Can one `DatagramSocketChannel` replace the per-client channels? Does a channel per client help?

:::hint
There is no connection to accept. The `ConnectionAcceptor` has nothing to do.
:::
:::hint
The reply must be sent to the address `receive` returned. Store that address with the outgoing buffer.
:::
:::hint
The official solution deletes the server socket channel and the acceptor, and registers the datagram channel for read and write.
:::
:::solution
a. As in the official solution: remove `ServerSocketChannel` and `SocketChannel`, create one non-blocking `DatagramSocketChannel` bound to the port, and register it for `OP_READ | OP_WRITE`. Delete `ConnectionAcceptor`. One `ConnectionHandler` calls non-blocking `receive` into a `ByteBuffer` and learns the `SocketAddress`. Protocol tasks must carry that address, and `write` sends through the datagram channel to the stored address. The output queue holds `(address, buffer)` pairs, not bare buffers.

b. UDP avoids the handshake and the per-client socket, and it can lose or reorder datagrams. One channel is what the design uses, because UDP has no connection to demultiplex with `accept`; the remote address is the demultiplexing key. A channel per client adds state the protocol does not need and does not make delivery reliable.
:::
:::

:::problem id=exam-16b-q3 source="Exams/16-b.pdf" kind=exam solution_origin=derived
The reactor's executor picks a task with no regard to how many bytes that client has already transferred, and no regard to how many requests that client has already had served. A busy client can be chosen forever.

a. (10) Give one short scenario for each unfairness.
b. (20) Implement two policies: prefer the client with the fewest bytes so far, and prefer the client with the fewest requests so far. You may introduce a `PriorityBlockingQueue` whose order is `compareTo` at `enqueue` time. Do not copy the whole reactor.

:::hint
The selector thread is not the place to scan every client on each event. The executor's queue is.
:::
:::hint
A priority computed only at enqueue goes stale. Say so if you still use that queue.
:::
:::hint
Each policy is a comparison key stored on the task: bytes, or request count.
:::
:::solution
a. Client A has sent one huge upload and client B has sent a few bytes. If the executor always prefers A, B waits behind a client who has already consumed the most bandwidth. Separately, client A has had a thousand requests and client B has had one. If the queue is FIFO among ready tasks, A stays ahead simply by arriving more often, and B's request count remains the smaller one while A is served again.

b. Put tasks in a queue ordered by the client's byte count, ascending, for the first policy, and by the client's served-request count for the second. The worker takes the minimum. Update the client's counters when a task finishes, and enqueue the next task for that client with the new key. A `PriorityBlockingQueue` that freezes `compareTo` at insertion will not move a task when the counter later changes; either re-enqueue, or document that the key is the count at enqueue, which still prevents a brand-new heavy client from jumping a client who has been waiting with a low count. The selector thread only enqueues. It does not run the protocol.
:::
:::

:::problem id=exam-17a-q3 source="Exams/17-a.pdf" kind=exam solution_origin=derived
Today the selector thread reads a `ByteBuffer` and a pool thread tokenizes and runs the message. A student wants the selector thread to tokenize as well, and to submit one `Runnable` per message.

a. (10) Apply that change.
b. (10) Show a run where the change hurts.
c. (10) Implement `ioThroughput` and `compThroughput` for the two stages.

:::hint
Tokenizing on the selector thread is exactly the "heavy work on the I/O thread" mistake when a message is large.
:::
:::hint
The hurt is `accept` and other clients' reads waiting behind a tokenize of one huge buffer.
:::
:::hint
Throughput is bytes, or messages, per second in each stage. Count them where the stage runs.
:::
:::solution
a. In the read path, after `channel.read`, run the tokenizer loop on the selector thread. Each complete message becomes a `Runnable` submitted to the executor. The pool no longer sees raw bytes.

b. One client sends a large buffer that tokenizes into many messages, or a tokenizer that scans a megabyte. The selector thread does that scan before it returns to `select`. Other clients' `accept` and `read` wait. Under the old split, the selector returned to `select` after the copy, and the pool did the scan.

c. `ioThroughput` is bytes read plus bytes written on the selector thread, divided by the elapsed time, using counters incremented next to `read` and `write`. `compThroughput` is messages whose protocol `process` returned, divided by elapsed time, incremented in the pool task. They are different stages, so a slow protocol drops `compThroughput` while `ioThroughput` stays high, which is the split the question wants visible.
:::
:::

:::problem id=exam-18a-q3 source="Exams/18-a.pdf" kind=exam solution_origin=derived
The selector thread is saturated.

a. Shraga says: add workers to the actor pool, and move the server to a machine with more processors, to take load off the selector. Does that work?
b. Nahum's team instead adds a feature to the reactor. Argue the selector-side fix.

:::hint
The selector loop is one thread by design. More pool threads do not run `select`.
:::
:::hint
A second processor does not split one thread.
:::
:::hint
The legal way to lighten the selector is to move work out of it, which is the opposite of Shraga's guess if the work is already in the pool.
:::
:::solution
a. No. `select`, `accept`, `read`, and `write` run on the one selector thread. Extra actor threads run protocol tasks. If the CPU is inside `select` and the copies, those threads sit idle. A bigger machine does not automatically shard one thread. Shraga's change helps only when the pool is the saturated part. The question says the selector is the saturated part.

b. Keep the selector loop to readiness and byte copies. Move tokenization and any logging off it. If one thread still cannot copy bytes fast enough, split channels across several reactors, each with its own selector and its own port or its own subset of channels. Do not take the selector lock on the pool threads.
:::
:::

:::problem id=exam-18b-q3 source="Exams/18-b.pdf" kind=exam solution_origin=derived
Shraga benchmarks a thread-per-client server and a reactor by sending a few requests from his laptop. The thread-per-client server answers faster, so he tells the company to switch. Nahum says the conclusion is wrong. Explain Nahum, including what the benchmark failed to stress.

:::hint
A handful of clients never makes thread creation or blocked stacks the bottleneck.
:::
:::hint
The reactor's advantage shows up when many connections are idle and a few are active.
:::
:::hint
Latency of one client and throughput under many clients are different measurements.
:::
:::solution
Shraga's client count is too small to pay for a thread per connection, and his requests are sequential enough that the accept-and-block design never has a thousand stacks parked in `read`. One thread per client can even be faster there, because the protocol runs on the connection's thread with no handoff to a pool. The reactor pays for `select`, buffers, and the queue.

Nahum is right that the conclusion does not transfer to the company's load. Under many mostly idle connections the thread-per-client server runs out of memory on stacks, and under a burst it creates threads without a cap. The reactor keeps one selector thread and a bounded pool. A fair benchmark holds thousands of connections open and measures how many requests per second survive, not the latency of five requests from a laptop.
:::
:::

:::problem id=exam-19a-q3 source="Exams/19-a.pdf" kind=exam solution_origin=derived
The actor pool promises two things for each connection: at most one request runs at a time, and if request 1 arrived before request 2 then response 1 is sent before response 2.

a. (8) Explain how the pool does that, naming the queue.
b. A change that hurts performance.
c. A change you would actually want.

:::hint
One active task per client is the first promise. A queue per client is the second.
:::
:::hint
The selector must enqueue in arrival order and must not start the task itself.
:::
:::hint
The reply is written on the selector thread from a queue, so completion order of the tasks is the send order only if the tasks were started in order and each queues its reply before the next task runs.
:::
:::solution
Each client has a queue of requests and a flag or a chain meaning "a task for this client is already in the pool." The selector enqueues an arrival and submits a pool task only when the chain was idle. The task runs the protocol for the head request, queues the response bytes for the selector to write, then starts the next request for that same client if the queue is not empty. Two requests of one client therefore never run together, and they run in arrival order, so the responses are queued in that order. The selector writes them in queue order.

A change that hurts: submitting every request to a shared pool with no per-client chain. Throughput of the pool goes up and the order promise dies. A change worth making: keep the chain, and do not allocate a fresh `Runnable` per message if the same worker can pull the next request itself. That is the 2019 B edit, and it preserves both promises.
:::
:::

:::problem id=exam-19b-q3 source="Exams/19-b.pdf" kind=exam solution_origin=derived
Change `execute` and `complete` so that when a worker finishes a request it runs the next waiting request of the same client on the same worker, with no new `Runnable`, until that client's queue is empty. Keep the reactor's split: the selector does I/O, workers do protocol.

:::hint
The loop belongs in the worker, after `process`, not in `select`.
:::
:::hint
The per-client queue is what `complete` used to schedule. Pull from it directly.
:::
:::hint
Do not hold a client lock while calling into the protocol if the protocol can call back into the reactor.
:::
:::solution
`execute` still submits one task when the client was idle. That task's `run` is a loop: take the next message under the client's lock, drop the lock, call `protocol.process`, queue the reply, then try again. When the queue is empty, clear the "running" flag. If a new message arrived after the flag was cleared, the selector submits one new task, as before. No second `Runnable` is allocated for a message that was already queued while the worker was alive. Replies still go out through the write queue, so the selector thread remains the only thread that touches `interestOps` and the channel.
:::
:::

:::problem id=exam-20a-q3 source="Exams/20-a.pdf" kind=exam solution_origin=derived
Add logging of server actions to the reactor. `Logger` wraps an `OutputStream`. Say where each log call goes so the selector thread does not block on disk, and so two workers do not tear a log line.

:::hint
A log line is a buffer, like a client reply. It can be queued.
:::
:::hint
`synchronized` on the logger, or one logger thread, makes lines atomic.
:::
:::hint
Do not call `OutputStream.write` inside `select`.
:::
:::solution
Workers and the selector enqueue a finished line, a `byte[]`, on a `BlockingQueue` owned by the logger. A single logger thread `take`s and writes to the stream. Lines stay intact because one thread writes them. The selector never blocks on the disk. If the queue is bounded, a full queue drops log lines or counts them; it does not `put` from the selector thread, because that would stall `select`. `Logger` methods that workers call only enqueue. They do not format and write under a lock held across a slow disk.
:::
:::

:::problem id=exam-24a-q3 source="Exams/24-a.pdf" kind=exam solution_origin=derived
A student changes `Reactor.handleReadWrite` to hand the ready key to `Executors.newFixedThreadPool(2)` named `communicationThreads`.

Explain why two communication threads calling `handleReadWrite` on the same selector's keys is unsafe, and what work, if any, may move to that pool. The question continues into a database; keep the selector correct first.

:::hint
`SelectionKey` and `Selector` are documented for use by one thread. `interestOps` from two threads races.
:::
:::hint
`selectedKeys` is not a concurrent collection.
:::
:::hint
The pool can run the protocol. It should not run `select` or `interestOps`.
:::
:::solution
`selector.selectedKeys()`, `key.interestOps`, and `channel.read` registered on that selector are the selector thread's job. Two pool threads pulling keys race on the key set and can change interest while `select` is using it. The selector can throw or miss an event. A write and a read on the same channel from two threads also tear the `ByteBuffer` the handler keeps.

Leave `select`, `accept`, `read`, `write`, and `interestOps` on one thread. The pool of two, if you want it, receives an already-copied message and runs the protocol, then enqueues reply bytes. That is the actor pool you already have. Pointing `handleReadWrite` itself at a pool of two is the change to reject. A database query belongs in that protocol task, not in `handleReadWrite`, so a slow query does not stop `select`.
:::
:::

:::problem id=exam-24b-q3 source="Exams/24-b.pdf" kind=exam solution_origin=derived
A logistics warehouse stores volunteers, evacuated families, and food portions. `DB` is thread-safe, has an empty constructor, and `executeQuery` returns the rows or throws `SQLException`.

Build `DBServer`: a reactor with ten worker threads. A client sends a query string. The server runs it on the one `DB` and replies with the first row, or `"Result No"` when there are no rows, or the error text when the query throws. Do not construct a `DB` per connection.

:::hint
One `DB` is created in `main` and captured by the protocol.
:::
:::hint
`executeQuery` is the slow call. It runs on a pool thread.
:::
:::hint
The reply is one string. The selector writes it. The protocol does not touch the channel.
:::
:::solution
```java
public class DBServer {
    public static void main(String[] args) throws Exception {
        DB db = new DB();
        new Reactor(Integer.parseInt(args[0]), 10,
            () -> new DBProtocol(db),
            () -> new LineTokenizer()).serve();
    }
}
```

`DBProtocol.process` calls `db.executeQuery(msg)` inside try. On a non-empty list it returns `rows.get(0)`. On an empty list it returns `"Result No"`. On `SQLException` it returns `e.getMessage()`. The reactor from class submits `process` to the pool of 10, so a slow query does not run on the selector thread. `DB` is thread-safe, so ten workers may call it. Constructing it inside the protocol factory would build one database per connection, which the question forbids because startup is heavy.
:::
:::

:::problem id=exam-24c-q3 source="Exams/24-c.pdf" kind=exam solution_origin=derived

a. (10) Change the server template so a client sends a message of type A and receives a reply of type B. Name the spots you edit. Do not rewrite whole classes.
b. Complete `Command` and `RemoteCommandInvocationProtocol`.
c. `DB.executeQuery` returns `ArrayList<String>` and is thread-safe. `DBServer` uses `BaseServer` with a pool of 11 and an `ObjectEncoderDecoder` that already exists. One `DB` serves every client.

:::hint
The encoder-decoder is generic. The protocol's input type and output type do not have to match.
:::
:::hint
A command object is what the decoder produces. `execute` is what the protocol calls.
:::
:::hint
Eleven is the pool size passed to the server, not eleven selector threads.
:::
:::solution
a. Change `MessagingProtocol<T>` into `MessagingProtocol<T, R>`, `process` returning `R`. The connection handler reads with `MessageEncoderDecoder<T>` and writes with `MessageEncoderDecoder<R>`, or one decoder that understands both if the exam's class is a single `MessageEncoderDecoder`. The reactor's type arguments follow. The selector loop does not change.

b. `Command` is `R execute(Context ctx)`. `RemoteCommandInvocationProtocol` holds the shared context, decodes a message into a `Command`, calls `execute`, and returns the result as the reply message.

c. `main` builds one `DB` and one `BaseServer` with pool size 11, protocol factory `() -> new RemoteCommandInvocationProtocol(db)`, and encoder factory `ObjectEncoderDecoder::new`. A query command's `execute` calls `db.executeQuery`. The returned list is the reply object. The encoder writes it. The selector thread never calls `executeQuery`.
:::
:::

The reactor moves bytes. [Serialization](topic:serialization) is how those bytes become an object, and [Persistence](topic:persistence) is the database those protocol tasks call.
