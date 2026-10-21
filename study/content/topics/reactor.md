---
id: reactor
title: The reactor
sources:
  - "materials/lectures/Chapter 11 - Reactor.pptx"
  - "materials/sessions/SPL_PS10.pptx"
  - "materials/sessions/SPL_PS11.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

A server cannot stop the world inside `accept`. The call returns one new connection, and the thread that accepted it has to be free for the next client. If that same thread then blocks while it reads, frames a message, or runs a query, every other connection waits behind it: no further `accept`, and no read of a client that is already ready. A thread per client moves the blocking work off the accepting thread, at the cost of a stack and a context switch for every connection, including the idle ones. The reactor design pattern keeps one thread waiting in `select` — in Java NIO, on a `Selector` — and dispatches the non-blocking channels that are ready. Copying bytes stays on that selector thread. A heavy call there stalls every client, so protocol work runs on a fixed pool of workers.

## Comparing server architectures

1. **Thread-per-client.** The server runs a separate thread for each connection. The model does not scale to thousands of connections: each thread owns a stack, and the processor spends time switching among them.
2. **Reactor.** One selector thread waits for many network events (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`) on non-blocking channels. It copies bytes and returns to `select`. Heavy protocol processing goes to a fixed pool of worker threads, shared across connections.

:::definition id=def-reactor title="Java NIO pieces of the reactor" source="materials/lectures/Chapter 11 - Reactor.pptx"

- **`Selector`:** the Java NIO object one thread waits on. `select` returns when registered channels are ready, and that thread dispatches the ready non-blocking channels.
- **`ServerSocketChannel` / `SocketChannel`:** channels that can be set to non-blocking mode with `configureBlocking(false)`.
- **`SelectionKey`:** the registration of a channel with the selector. The interest set names the operations to watch (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`). `readyOps()` reports which of those operations are ready.
- **`ByteBuffer`:** a memory buffer used for reading and writing.
:::

![The reactor loop: one selector thread, ready keys, and a pool only for protocol work](../assets/figures/reactor-loop.svg)

## Using a ByteBuffer correctly

The class `ByteBuffer` keeps three indexes: `position`, `limit`, and `capacity`. `channel.read` and `put` write into the buffer and advance `position`. `flip` switches the buffer from writing into it to reading out of it: it sets `limit` to the current `position` and `position` to 0, so the next `get` or `channel.write` walks the bytes just stored. `clear` sets `position` to 0 and `limit` to `capacity`, which prepares the same buffer for another fill.

```java
ByteBuffer buf = ByteBuffer.allocate(1024);
channel.read(buf);   // Read bytes from channel into buffer (position advances)
buf.flip();          // Prepare for reading from buffer: limit = position, position = 0
channel.write(buf);  // Write bytes from buffer to channel
buf.clear();         // Reset buffer for writing: position = 0, limit = capacity

```

![Before flip the readable window is empty because position is already at the end of the data. flip sets limit to that end and position to 0](../assets/figures/buffer-flip.svg)

:::trap
Leaving `OP_WRITE` set in the interest set of a `SelectionKey`, while the write queue has nothing to send, makes `select` spin. The channel is already ready for writing, so `select` returns at once and the loop runs again. Set `OP_WRITE` only while the write queue holds bytes, and clear it once the last of those bytes has been written.
:::

:::problem id=worked-flip title="Flipping a buffer" source="materials/sessions/SPL_PS10.pptx" kind=worked solution_origin=source
You have just read 5 bytes and want to write those bytes. What does `flip` change?

```java
ByteBuffer buf = ByteBuffer.allocate(16);
channel.read(buf);    // position == 5, limit == 16
buf.flip();
channel.write(buf);
```

:::solution
`flip` sets `limit` to 5 and `position` to 0. It switches the buffer from writing into it to reading out of it. The `channel.write(buf)` that follows writes those five bytes. The capacity is still 16. Skipping `flip` starts the write at position 5 and stops at limit 16, which is the empty tail, so nothing useful is sent. A second call to `flip` sets `limit` to 0, because `position` is already 0.
:::
:::

:::check id=chk-write-interest
A channel's write queue is empty, and `OP_WRITE` is still set. What does the selector thread do?

- [ ] It blocks in `select` until the client sends a byte
- [x] It spins, because the channel is already ready for writing
- [ ] It closes the channel

A channel with free space in its send buffer is ready for writing. `select` returns at once. The lecture calls the resulting loop a spin. Clear `OP_WRITE` from the interest set until a later step has placed a reply on the write queue.
:::

## Practice

:::problem id=ps10-flip title="position after flip" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
A buffer was `clear`ed at capacity 8, then three bytes were `put`. Give `position` and `limit` before `flip` and after `flip`. Then say which range a `write` to the channel sends.

:::hint
`clear` sets `position` to 0 and sets `limit` equal to `capacity`.
:::
:::hint
`put` advances `position` and leaves `limit` where it is.
:::
:::hint
`flip` switches a buffer from "bytes have been written into it" to "read out what was written".
:::
:::solution
After `clear`: position 0, limit 8, capacity 8. After three `put` calls: position 3, limit 8, capacity 8. After `flip`: position 0, limit 3, capacity 8. `channel.write` sends the bytes in `[position, limit)`, which is those three bytes. The other five lie past `limit` and are not sent.
:::
:::

:::problem id=ps11-actor-order title="Task order" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
A client sends message M1 and then M2. The server creates tasks R1 and R2. Why can an ordinary thread pool run R2 before R1, and what does an actor pool change about that ordering?

:::hint
The pool has many workers. Two submitted tasks can start on two workers.
:::
:::hint
The picture in the session is one queue per client.
:::
:::hint
The property to preserve is order for a single client. Other clients may still run at the same time.
:::
:::solution
`execute(R1)` and `execute(R2)` are two tasks. A pool with two free workers can start R2 first. An ordinary pool keeps no record that the two tasks belong to one channel.

An actor pool keeps a queue for that client and will not start R2 while R1 is still running for the same actor. Different clients still run concurrently, on the pool's threads. The selector thread only enqueues. Session 11 therefore treats an ordinary pool as the wrong tool for a protocol that assumes messages stay in order.
:::
:::

:::problem id=ps11-write-interest title="Write interest" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
Here are four reactor mistakes. Choose the one that burns a core while no client is sending, and give the `interestOps` change that stops it.

1. `OP_WRITE` stays set while the write queue is empty.
2. A read with no size bound, so the buffers grow without limit.
3. Heavy or blocking work on the selector thread.
4. A call to `interestOps` from a thread other than the selector thread.

:::hint
`select` returns immediately when any registered interest is already true.
:::
:::hint
A socket you are not currently writing is still ready for writing when the TCP window has room.
:::
:::hint
Clear `OP_WRITE`. Leave `OP_READ` in the interest set.
:::
:::solution
Leaving `OP_WRITE` set on an idle channel is the spin. The channel is ready for writing, so `select` never blocks. After the last queued byte has been written, put the interest set back to `OP_READ` alone:

```java
key.interestOps(SelectionKey.OP_READ);
```

Set `OP_WRITE` again only when a protocol reply has been queued and `write` did not accept every byte. Make that `interestOps` call on the selector thread. The lecture counts `interestOps` from another thread as a separate bug.
:::
:::

:::examnote
The question edits the reactor from the appendix. It moves framing off the selector, bounds the work per client, adds a log, or serves a database query while `select` keeps running. The trap is a heavy call on the selector thread, which stalls every client, or leaving `OP_WRITE` set so that `select` spins forever.
:::

:::problem id=exam-15a-q3 title="A reactor over UDP" source="materials/exams/15-a.pdf" kind=exam solution_origin=source
Keep the reactor, and talk to every client through one `DatagramSocketChannel`. There is no TCP `SocketChannel` per client. `send` and `receive` are non-blocking and return immediately. `receive` returns the sender's address, or null when nothing has arrived.

a. Say which methods you change. Leave methods you keep unwritten.
b. Name one advantage and one disadvantage of UDP here. Can one `DatagramSocketChannel` replace the per-client channels? Does a channel per client help?

:::hint
There is no connection to accept. `ConnectionAcceptor` has nothing to do.
:::
:::hint
The reply has to go to the address that `receive` returned. Store that address with the outgoing buffer.
:::
:::hint
The official solution removes the server socket channel and the acceptor, and registers the datagram channel for reading and writing.
:::
:::solution
a. As in the official solution: remove `ServerSocketChannel` and `SocketChannel`, create one non-blocking `DatagramSocketChannel` bound to the port, and register it for `OP_READ | OP_WRITE`. Delete `ConnectionAcceptor`. One `ConnectionHandler` calls non-blocking `receive` into a `ByteBuffer` and learns the `SocketAddress`. Protocol tasks carry that address, and `write` sends through the datagram channel to the stored address. The output queue holds pairs `(address, buffer)`.

b. UDP skips the handshake and the socket per client. It can drop datagrams or change their order. One channel is what this design uses, because UDP has no connection for `accept` to split off. The remote address is the key that separates clients. A channel per client adds state the protocol does not use, and delivery stays unreliable.
:::
:::

:::problem id=exam-16b-q3 title="Executor fairness" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
The reactor's executor chooses a task with no regard for how many bytes this client has already transferred, and with no regard for how many of this client's requests have already been served. A busy client can be chosen forever.

a. Give one short scenario for each kind of unfairness.
b. Implement two policies: prefer the client with the fewest bytes so far, and prefer the client with the fewest requests so far. A `PriorityBlockingQueue` whose order is `compareTo` at `enqueue` time is allowed. Leave the rest of the reactor uncopied.

:::hint
The selector thread is the wrong place to scan every client on every event. The executor's queue is the place.
:::
:::hint
A priority computed only at enqueue goes stale. Say so if you still use that queue.
:::
:::hint
Each policy is a comparison key stored on the task: a byte count, or a request count.
:::
:::solution
a. Client A sent one huge upload and client B sent a few bytes. If the executor always prefers A, then B waits behind a client that has already consumed most of the bandwidth. Separately, client A had a thousand requests and client B had one. If the queue is FIFO among ready tasks, A stays ahead simply because A arrives more often, and B's request count stays the smaller one while A is served again.

b. Place tasks on a queue ordered by the client's byte count, ascending, for the first policy, and by the count of requests already served for the second policy. The worker takes the minimum. Update the client's counters when a task finishes, and enqueue that client's next task with the new key. A `PriorityBlockingQueue` that freezes `compareTo` at insertion will not move a task when the counter changes later. Either reinsert the task, or record that the key is the count at insertion time. That still keeps a brand-new heavy client from jumping ahead of a client who has been waiting with a low count. The selector thread only enqueues. Protocol work stays on the workers.
:::
:::

:::problem id=exam-17a-q3 title="Where framing runs" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
Today the selector thread reads a `ByteBuffer`, and a pool thread frames the bytes and runs the message. A student wants the selector thread to frame as well, and to submit one `Runnable` per message.

a. Apply the change.
b. Show a run in which the change does harm.
c. Implement `ioThroughput` and `compThroughput` for the two stages.

:::hint
Framing on the selector thread is the "heavy work on the I/O thread" mistake when the message is large.
:::
:::hint
The damage is that `accept`, and reads for other clients, wait behind the framing of one huge buffer.
:::
:::hint
Throughput is bytes, or messages, per second in each stage. Count them where that stage runs.
:::
:::solution
a. On the read path, after `channel.read`, run the framing loop on the selector thread. Each complete message becomes a `Runnable` submitted to the executor. The pool receives one complete message per task.

b. One client sends a large buffer that frames into many messages, or a framer scans a megabyte. The selector thread does that scan before it returns to `select`. `accept` and the `read` calls of other clients wait. Under the old split, the selector returned to `select` after the copy, and the pool did the scan. A heavy call on the selector thread stalls every client.

c. `ioThroughput` is bytes read plus bytes written on the selector thread, divided by the elapsed time, with counters that increase beside `read` and `write`. `compThroughput` is the number of messages whose protocol `process` has returned, divided by the elapsed time, and that counter increases in the pool task. The two numbers measure different stages, so a slow protocol lowers `compThroughput` while `ioThroughput` stays high. That split is what the question wants visible.
:::
:::

:::problem id=exam-18a-q3 title="A saturated selector" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
The selector thread is saturated.

a. Shraga says: add workers to the actor pool, and move the server to a machine with more processors, in order to take load off the selector. Does this work?
b. Nahum's team adds capacity to the reactor on the selector side. Justify that fix.

:::hint
The selector loop is one thread by design. Extra pool threads do not run `select`.
:::
:::hint
A second processor does not split one thread.
:::
:::hint
The way to relieve the selector is to take work out of it. Shraga's extra workers help when the pool is the saturated part.
:::
:::solution
a. No. `select`, `accept`, `read`, and `write` run on the one selector thread. Extra actor threads run protocol tasks. When the CPU time sits inside `select` and the byte copies, those threads stay idle. A larger machine does not split one thread by itself. Shraga's change helps when the pool is the saturated part. The question says the selector is the saturated part.

b. Leave the selector loop for readiness and for byte copies. Move framing, and every log write, out of that loop. If one thread still cannot copy bytes fast enough, split the channels across several reactors, each with its own selector and its own port, or its own subset of channels. Keep the selector's lock off the pool threads.
:::
:::

:::problem id=exam-18b-q3 title="A misleading measurement" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
Shraga measures a thread-per-client server and a reactor by sending a few requests from his laptop. The thread-per-client server answers faster, so he tells the company to switch. Nahum says the conclusion is wrong. Explain Nahum, including what the measurement failed to stress.

:::hint
A handful of clients never makes thread creation, or stacks blocked in `read`, the bottleneck.
:::
:::hint
The reactor's advantage shows up when many connections are idle and few are active.
:::
:::hint
The latency of one client and the throughput under many clients are different measurements.
:::
:::solution
Shraga's client count is too small to pay for a thread per connection, and his requests are sequential enough that the accept-and-block design never holds a thousand stacks parked in `read`. One thread per client can even be faster there, because the protocol runs on the connection's thread with no handoff to a pool. The reactor pays for `select`, for buffers, and for the queue.

Nahum is right that the conclusion does not carry to the company's load. Under many connections, most of them idle, a thread-per-client server runs out of memory on stacks, and under a burst it creates threads with no ceiling. The reactor keeps one selector thread and a bounded pool. A fair measurement holds thousands of connections open and counts how many requests per second complete. The latency of five requests from a laptop is a different number, and it is the number Shraga reported.
:::
:::

:::problem id=exam-19a-q3 title="What an actor pool promises" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
The actor pool promises two things for each connection. At most one request of that connection runs at a time. If request 1 arrived before request 2, reply 1 is sent before reply 2.

a. Explain how the pool does this, and name the queue.
b. Name a change that breaks one of the promises.
c. Name a change you would actually want.

:::hint
One active task per client is the first promise. A queue per client is the second.
:::
:::hint
The selector must enqueue in arrival order, and it must leave the task unstarted.
:::
:::hint
The selector writes each reply from a queue. Send order follows task order when the tasks started in arrival order and each task queues its reply before the next task of that client runs.
:::
:::solution
Each client has a request queue and a flag, or a chain, meaning "a task for this client is already in the pool." The selector enqueues an arrival and submits a pool task only when the chain was idle. The task runs the protocol for the request at the head, queues the reply bytes for the selector to write, and then starts the next request of the same client when the queue still holds one. Two requests of one client therefore never run together. They run in arrival order, so the replies are queued in that order. The selector writes them in queue order.

A change that breaks a promise: submit every request to a shared pool with no per-client chain. Pool throughput goes up, and the order promise is gone. A change worth making: keep the chain, and skip allocating a new `Runnable` for every message when the same worker can pull the next request itself. That edit, in which the same worker pulls the next request, keeps both promises.
:::
:::

:::problem id=exam-19b-q3 title="The next request on the same worker" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
Change `execute` and `complete` so that when a worker finishes a request it runs the next waiting request of the same client on that same worker, with no new `Runnable`, until that client's queue is empty. Keep the reactor's split: the selector does the I/O, and the workers run the protocol.

:::hint
The loop belongs on the worker, after `process`, outside `select`.
:::
:::hint
The per-client queue is what `complete` used to schedule. Pull from it directly.
:::
:::hint
Release the client lock before the protocol call when the protocol can call back into the reactor.
:::
:::solution
`execute` still submits one task when the client was idle. The `run` of that task is a loop: take the next message under the client lock, release the lock, call `protocol.process`, queue the reply, and then try again. When the queue is empty, clear the "running" flag. If a new message arrives after the flag was cleared, the selector submits one new task, as before. A second `Runnable` is not allocated for a message that was already queued while the worker was alive. Replies still leave through the write queue, so the selector thread remains the only thread that touches `interestOps` and the channel.
:::
:::

:::problem id=exam-20a-q3 title="Logging off the selector thread" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
Add a record of server actions to the reactor. `Logger` wraps an `OutputStream`. Say where each log call goes so the selector thread stays off the disk, and so each log line is written whole when two workers log at once.

:::hint
A log line is a buffer, in the same way a client reply is. It can be queued.
:::
:::hint
`synchronized` on the logger, or a single logger thread, keeps each line whole.
:::
:::hint
Keep `OutputStream.write` outside `select`.
:::
:::solution
Workers and the selector place a finished line, a `byte[]`, on a `BlockingQueue` owned by the logger. A single logger thread does `take` and writes to the stream. Lines stay whole because one thread writes them. The selector thread never blocks on the disk. When the queue is bounded, a full queue drops log lines or counts them. A `put` from the selector thread would stop `select`, so the selector only offers a line when the queue has room. `Logger` methods that workers call only enqueue. Formatting and the stream write run on the logger thread, so a slow disk sits outside any lock the workers hold.
:::
:::

:::problem id=exam-24a-q3 title="Communication threads" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
A student changes `Reactor.handleReadWrite` so that it hands the ready key to `Executors.newFixedThreadPool(2)`, under the name `communicationThreads`.

Explain why two communication threads that call `handleReadWrite` on keys of the same selector are unsafe, and which work, if any, may move to that pool. The question continues on to a database. Keep the selector correct first.

:::hint
`SelectionKey` and `Selector` are documented for use by one thread. `interestOps` from two threads is a race.
:::
:::hint
`selectedKeys` is a set meant for one thread.
:::
:::hint
The pool can run the protocol. `select` and `interestOps` stay on the selector thread.
:::
:::solution
`selector.selectedKeys()`, `key.interestOps`, and `channel.read` on a channel registered with this selector are the selector thread's work. Two pool threads that pull keys race on the key set, and they can change the interest set while `select` is using it. The selector can throw, or it can miss an event. A read and a write on the same channel from two threads also tear the `ByteBuffer` the handler holds.

Leave `select`, `accept`, `read`, `write`, and `interestOps` on one thread. The pool of two, if you keep it, receives a message that has already been copied, runs the protocol, and then queues the reply bytes. That pool is the actor pool the reactor already has. Pointing `handleReadWrite` itself at a pool of two is the change to reject. A database query belongs on that protocol task, inside the pool, so a slow query does not stop `select`.
:::
:::

:::problem id=exam-24b-q3 title="A warehouse server" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
A logistics warehouse stores volunteers, evacuated families, and food parcels. `DB` is thread-safe, it has an empty constructor, and `executeQuery` returns the rows or throws `SQLException`.

Build `DBServer`: a reactor with ten worker threads. A client sends a query string. The server runs it on the one shared `DB` and replies with the first row, or with `"Result No"` when there are no rows, or with the error text when the query throws. One `DB` serves every connection.

:::hint
One `DB` is created in `main` and captured by the protocol.
:::
:::hint
`executeQuery` is the slow call. It runs on a pool thread.
:::
:::hint
The reply is a single string. The selector writes it. The protocol does not touch the channel.
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

`DBProtocol.process` calls `db.executeQuery(msg)` inside a try. On a non-empty list it returns `rows.get(0)`. On an empty list it returns `"Result No"`. On `SQLException` it returns `e.getMessage()`. The classroom reactor submits `process` to the pool of 10, so a slow query runs on a worker while the selector thread stays in `select`. `DB` is thread-safe, so the ten workers may call it. Constructing it inside the protocol factory would build one database per connection. The question rules that out, because startup is heavy.
:::
:::

:::problem id=exam-24c-q3 title="A reply of another type" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived

a. Change the server pattern so that a client sends a message of type A and receives a reply of type B. Name the places you edit. Leave whole classes unwritten.
b. Complete `Command` and `RemoteCommandInvocationProtocol`.
c. `DB.executeQuery` returns `ArrayList<String>` and is thread-safe. `DBServer` uses `BaseServer` with a pool of 11 and the `ObjectEncoderDecoder` that already exists. One `DB` serves every client.

:::hint
The encoder-decoder is generic. The protocol's input type and output type may differ.
:::
:::hint
A command object is what the decoder produces. `execute` is what the protocol calls.
:::
:::hint
Eleven is the pool size passed to the server. The selector thread stays a single thread.
:::
:::solution
a. Change `MessagingProtocol<T>` to `MessagingProtocol<T, R>`, and have `process` return `R`. The connection handler reads with `MessageEncoderDecoder<T>` and writes with `MessageEncoderDecoder<R>`, or with one decoder that understands both when the class in the question is a single `MessageEncoderDecoder`. The reactor's type arguments follow that split. The selector loop stays as it is.

b. `Command` is `R execute(Context ctx)`. `RemoteCommandInvocationProtocol` holds the shared context, decodes a message into a `Command`, calls `execute`, and returns the result as the reply message.

c. `main` builds one `DB` and one `BaseServer` with pool size 11, a protocol factory `() -> new RemoteCommandInvocationProtocol(db)`, and an encoder factory `ObjectEncoderDecoder::new`. The query command's `execute` calls `db.executeQuery`. The list that comes back is the reply object. The encoder writes it. `executeQuery` runs inside the pool task.
:::
:::

The reactor moves bytes. [Serialization](topic:serialization) is how those bytes become an object, and [persistence](topic:persistence) is the database these protocol tasks query.
