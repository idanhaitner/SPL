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
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

A server must keep accepting and serving clients, even while one client is slow.

- **The problem:** if the thread that accepts connections ever blocks on one client, every other client waits.
- **The two solutions:** give every client its own thread, or use one selector thread that only handles the connections that are ready right now.
- **This chapter** compares the two designs, and walks through the reactor pattern used in the course.

## Comparing server architectures

- **`accept`** returns one new connection, and the thread that called it must then be free again to accept the next client.
- **Blocking that thread stalls everyone:** while it waits in a read, a framing step, or a database query, no new client is accepted, and no other ready client is read.
- **Thread-per-client** moves the blocking work to a separate thread for each connection. The cost is a stack and context switches for every connection, even the idle ones.
- **The reactor pattern** keeps one thread waiting in `select` (in Java NIO, on a `Selector`), and has it handle only the non-blocking channels that are ready.
- **The selector thread only copies bytes.** Any heavy call on it would stall every client, so the protocol work runs on a fixed pool of worker threads.

In summary, the two designs look like this.

- **Thread-per-client** runs a separate thread for each connection.
- **Its weakness:** it does not scale to thousands of connections, because each thread needs its own stack, and the processor wastes time switching among them.
- **The reactor** uses one selector thread to handle the network events (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`) of many non-blocking channels.
- **That thread** only copies bytes, then goes straight back to `select`.
- **The heavy protocol work** goes to a fixed pool of worker threads, shared by all connections.

:::definition id=def-reactor title="Java NIO pieces of the reactor" source="materials/lectures/Chapter 11 - Reactor.pptx"

- **`Selector`:** the Java NIO object that the reactor's thread waits on. `select` returns when at least one registered channel is ready, and the thread then handles the ready channels.
- **`ServerSocketChannel` and `SocketChannel`:** the server and client channels. They can be made non-blocking with `configureBlocking(false)`.
- **`SelectionKey`:** the record of one channel's registration with the selector. Its interest set says which operations to watch (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`), and `readyOps()` says which of them are ready now.
- **`ByteBuffer`:** a block of memory that data is read into and written out of.
:::

![The reactor loop: one selector thread, ready keys, and a pool only for protocol work](../../web/public/figures/reactor-loop.svg)

## ByteBuffer indexes

A `ByteBuffer` keeps three indexes: `position`, `limit`, and `capacity`.

- **`capacity`** is the buffer's total size, and it never changes.
- **Filling the buffer:** `channel.read` and `put` store bytes at `position`, and advance `position` past them.
- **`flip`** switches the buffer from filling to draining: it sets `limit` to the current `position`, and `position` to 0. The next `get` or `channel.write` then reads exactly the bytes that were just stored.
- **`clear`** sets `position` to 0 and `limit` to `capacity`, which makes the whole buffer available for the next fill.

```java
ByteBuffer buf = ByteBuffer.allocate(1024);
channel.read(buf);   // Read bytes from channel into buffer (position advances)
buf.flip();          // Prepare for reading from buffer: limit = position, position = 0
channel.write(buf);  // Write bytes from buffer to channel
buf.clear();         // Reset buffer for writing: position = 0, limit = capacity

```

![Before flip the readable window is empty because position is already at the end of the data. flip sets limit to that end and position to 0](../../web/public/figures/buffer-flip.svg)

:::trap
Leaving `OP_WRITE` set when there is nothing to send makes `select` spin.

- **Why:** a channel is almost always ready for writing, so `select` returns immediately, finds nothing to do, and loops again, burning a whole CPU core.
- **The fix:** set `OP_WRITE` only while the write queue holds bytes, and clear it as soon as the last of them has been written.
:::

:::problem id=worked-flip title="Flipping a buffer" source="materials/sessions/SPL_PS10.pptx" kind=worked solution_origin=source
You have just read 5 bytes into the buffer and now want to write them out. What does `flip` change?

```java
ByteBuffer buf = ByteBuffer.allocate(16);
channel.read(buf);    // position == 5, limit == 16
buf.flip();
channel.write(buf);
```

:::solution

- **What `flip` does:** it sets `limit` to 5 and `position` to 0, so the buffer is ready to be read from.
- **Then `channel.write(buf)`** sends exactly those five bytes. The capacity is still 16.
- **Without `flip`:** the write would start at position 5 and stop at limit 16, sending the empty tail of the buffer instead of the data.
- **Calling `flip` twice in a row** is also a bug: the second call sets `limit` to 0, because `position` is already 0, so the buffer looks empty.
:::
:::

:::check id=chk-write-interest
A channel's write queue is empty, and `OP_WRITE` is still set. What does the selector thread do?

- [ ] It blocks in `select` until the client sends a byte
- [x] It spins, because the channel is already ready for writing
- [ ] It closes the channel

- **Why it spins:** a channel with free space in its send buffer counts as ready for writing, so `select` returns immediately, over and over.
- **The fix:** clear `OP_WRITE` from the interest set, and set it again only when a reply is waiting in the write queue.
:::

## Practice

:::problem id=ps10-flip title="position after flip" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
A buffer with capacity 8 was cleared, and then three bytes were stored in it with `put`.

:::check id=ps10-flip-q1
Which of these hold before `flip`?

- [ ] After three `put` calls, `limit` is 3
- [x] After `clear`, position is 0, limit is 8, and capacity is 8
- [ ] After three `put` calls, capacity is 3
- [x] After three `put` calls, position is 3 and limit is 8

- **After `clear`:** position is 0, limit is 8, and capacity is 8.
- **After three `put` calls:** position has advanced to 3. Limit and capacity are still 8, because `put` never changes them.
:::

:::check id=ps10-flip-q2
After `flip`, `position` is {{=0|3|8}} and `limit` is {{=3|8|0}}.

`flip` moves the limit to where the data ends, 3, and resets the position to 0. The capacity stays 8.
:::

:::check id=ps10-flip-q3
What does `channel.write` send?

- [x] The three bytes in `[position, limit)`
- [ ] The five bytes past `limit`
- [ ] All eight bytes of capacity
- [ ] Nothing, because `position` is 0

- **`channel.write` sends the bytes from `position` up to, but not including, `limit`.** Here that is the three stored bytes.
- **The other five bytes** of capacity lie past `limit`, so they are not sent.
:::
:::

:::problem id=ps11-actor-order title="Task order" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
A client sends message M1 and then message M2. The server turns them into tasks R1 and R2.

:::check id=ps11-actor-order-q1
Why can an ordinary pool start R2 before R1?

- [ ] The selector thread runs R2 before it enqueues R1
- [x] `execute(R1)` and `execute(R2)` are two tasks, and two free workers can start R2 first
- [ ] The pool records that both tasks belong to one channel and still prefers R2
- [ ] R1 and R2 share one worker, so the later submit runs first

- **An ordinary pool treats R1 and R2 as unrelated tasks.** If two workers are free, both tasks may start at once, and R2 may even finish first.
- **The reason:** the pool keeps no record that both tasks came from the same client.
:::

:::check id=ps11-actor-order-q2
An actor pool keeps a {{=queue for that client|single queue for every client|lock inside select}} and will not start R2 while R1 is still running for the same {{=actor|selector|port}}.

An actor pool keeps a separate queue for each client, which the pool calls an actor. It never starts R2 while R1 is still running for the same actor, so each client's messages are handled one at a time, in order.
:::

:::check id=ps11-actor-order-q3
Which of these hold?

- [ ] The selector thread runs the protocol for R1 and R2
- [x] Different clients still run concurrently, on the pool's threads
- [x] The selector thread only enqueues
- [x] An ordinary pool is the wrong tool for a protocol that assumes messages stay in order

- **Different clients still run in parallel** on the pool's threads. Only messages from the same client wait for each other.
- **The selector thread only enqueues** the tasks. It never runs the protocol itself.
- **So an ordinary pool is the wrong tool** for any protocol that relies on messages being handled in order.
:::
:::

:::problem id=ps11-write-interest title="Write interest" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
Here are four common reactor mistakes.

- **Leaving `OP_WRITE` set** while the write queue is empty.
- **Reading with no size limit,** so the buffers can grow without bound.
- **Doing heavy or blocking work** on the selector thread.
- **Calling `interestOps`** from a thread other than the selector thread.

:::check id=ps11-write-interest-q1
Which mistake burns a core while no client is sending?

- [ ] A read with no size bound, so the buffers grow without limit
- [ ] Heavy or blocking work on the selector thread
- [x] `OP_WRITE` stays set while the write queue is empty
- [ ] `interestOps` from a thread other than the selector thread

Leaving `OP_WRITE` set on an idle channel causes the spin. The channel is always ready for writing, so `select` never blocks, and the loop runs non-stop even though no client is sending.
:::

:::check id=ps11-write-interest-q2
After the last queued byte has been written, the interest set goes back to {{=OP_READ alone|OP_WRITE alone|OP_READ together with OP_WRITE}}.

Once everything has been written, the channel only needs to wait for input again, so set the interest set back to `OP_READ` alone, with `key.interestOps(SelectionKey.OP_READ)`.
:::

:::check id=ps11-write-interest-q3
When is `OP_WRITE` set again?

- [ ] While the write queue is empty, so `select` stays awake
- [ ] From a pool thread, as soon as the protocol returns
- [x] When a protocol reply has been queued and `write` did not accept every byte
- [ ] On every channel, for the whole life of the connection

Turn `OP_WRITE` on only when there is something left to send: a reply has been queued, and `write` could not send all of it at once. The selector will then report when the channel can take more.
:::

:::check id=ps11-write-interest-q4
Which of these hold?

- [ ] `interestOps` from another thread is the same bug as the spin
- [x] The `interestOps` call that clears `OP_WRITE` is made on the selector thread
- [ ] Clearing `OP_WRITE` is what makes `select` spin
- [x] Calling `interestOps` from another thread is a separate bug

- **The right place:** the `interestOps` call that clears `OP_WRITE` belongs on the selector thread.
- **A separate bug:** calling `interestOps` from another thread is a different mistake from the spin. It can race with `select`.
- **Clearing `OP_WRITE` does not cause the spin.** It is the cure for it.
:::
:::

:::examnote
- **What the question looks like:** it changes the reactor from the exam's appendix, for example by moving framing off the selector, limiting the work per client, adding a log, or serving a database query while `select` keeps running.
- **The usual traps:** putting a heavy call on the selector thread, which stalls every client, or leaving `OP_WRITE` set so that `select` spins forever.
:::

:::problem id=exam-15a-q3 title="A reactor over UDP" source="materials/exams/15-a.pdf" kind=exam solution_origin=source
Change the reactor to use UDP: it talks to every client through a single `DatagramSocketChannel`, instead of one TCP `SocketChannel` per client.

- **`send` and `receive`** are non-blocking, and return immediately.
- **`receive`** returns the sender's address, or null when nothing has arrived.

:::check id=exam-15a-q3-q1
Which of these match the change?

- [ ] Keep `ConnectionAcceptor` and accept datagram connections
- [x] Remove `ServerSocketChannel` and `SocketChannel`
- [x] Delete `ConnectionAcceptor`
- [x] Create one non-blocking `DatagramSocketChannel`, bound to the port, and register it for reading and writing

UDP has no connections, so there is nothing to accept. Remove `ServerSocketChannel`, `SocketChannel`, and `ConnectionAcceptor`. Instead, create one non-blocking `DatagramSocketChannel` bound to the port, and register it for `OP_READ | OP_WRITE`.
:::

:::check id=exam-15a-q3-q2
`receive` learns the sender's {{=SocketAddress|SocketChannel|SelectionKey}}. The output queue holds pairs of {{=address and buffer|channel and selector|port and key}}.

- **Receiving:** a single `ConnectionHandler` calls the non-blocking `receive` into a `ByteBuffer`, which also gives it the sender's `SocketAddress`.
- **Replying:** each protocol task remembers that address, so the reply can be sent back to the right client through the same channel.
- **The output queue** therefore holds pairs of (address, buffer): what to send, and to whom.
:::

:::check id=exam-15a-q3-q3
What advantage does UDP give this server?

- [x] It skips the handshake and the socket per client
- [ ] It keeps every datagram, in send order
- [ ] It gives `accept` a connection to split off
- [ ] It needs one channel per client to stay reliable

UDP needs no connection handshake and no socket per client. It does not keep datagrams or their order, and it has no `accept`.
:::

:::check id=exam-15a-q3-q4
Which of these hold?

- [x] UDP can drop datagrams or change their order
- [ ] A channel per client makes delivery reliable
- [x] One channel is what this design uses, because UDP has no connection for `accept` to split off
- [x] The remote address is the key that separates clients

- **UDP is unreliable:** datagrams can be lost or arrive in a different order.
- **One channel serves everyone,** because UDP has no connections for `accept` to create.
- **Clients are told apart by their remote address.** A channel per client would add state without making delivery any more reliable.
:::
:::

:::problem id=exam-16b-q3 title="Executor fairness" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
The reactor's executor picks tasks without looking at how many bytes a client has already transferred, or how many of its requests have already been served. As a result, one busy client can be chosen again and again while others wait.

:::check id=exam-16b-q3-q1
Which scenario is unfairness by bytes transferred?

- [ ] Client A had a thousand requests and client B had one, and a FIFO queue keeps serving A because A arrives more often
- [x] Client A sent one huge upload and client B sent a few bytes, and the executor always prefers A, so B waits
- [ ] The selector thread scans every client on every event and picks A
- [ ] A and B have the same byte count, so the queue freezes

Unfairness by bytes means the client that has already moved the most data keeps getting served. If A sent one huge upload, B sent a few bytes, and the executor keeps preferring A, then B waits behind a client that has already used most of the bandwidth.
:::

:::check id=exam-16b-q3-q2
Which scenario is unfairness by requests already served?

- [ ] A huge upload is always preferred over a few bytes
- [ ] B is served first because B already has the smaller request count
- [x] A FIFO queue among ready tasks keeps A ahead because A arrives more often, while B's request count stays the smaller one
- [ ] The worker takes the client with the most requests so far

- **The setup:** client A has had a thousand requests served, and client B only one.
- **What goes wrong:** with a plain FIFO queue, A keeps getting served simply because its requests arrive more often, while B stays far behind.
:::

:::check id=exam-16b-q3-q3
The fewest-bytes policy orders tasks by {{=the client's byte count, ascending|the client's byte count, descending|arrival order}}. The fewest-requests policy orders them by {{=requests already served|bytes still waiting|the selector's ready set}}. The worker takes the {{=minimum|maximum|newest task}}.

Both fixes use a priority queue. For the first policy, order the tasks by the client's byte count, from smallest to largest. For the second, order them by the number of requests already served. Either way, the worker always takes the task with the smallest value, so the client that has received the least goes first.
:::

:::check id=exam-16b-q3-q4
A `PriorityBlockingQueue` freezes `compareTo` at insertion. What follows?

- [ ] Every waiting task moves as soon as a counter changes
- [ ] Protocol work moves onto the selector thread
- [x] A task does not move when the counter changes later, so reinsert it or keep the count from insertion time
- [ ] A brand-new heavy client jumps ahead of a client who has been waiting with a low count

- **The limitation:** a `PriorityBlockingQueue` positions each task when it is inserted. If the client's counter changes later, the task does not move.
- **Two ways to handle it:** remove and reinsert the task when its counter changes, or simply define the priority as the count at insertion time.
- **Waiting clients are still protected:** a heavy client's new task has a high count, so it cannot jump ahead of a client that has been waiting with a low count.
:::
:::

:::problem id=exam-17a-q3 title="Where framing runs" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
In the current design, the selector thread reads bytes into a `ByteBuffer`, and a pool thread splits them into messages (frames them) and runs the protocol. A student wants the selector thread to do the framing too, and to submit one `Runnable` per complete message.

:::check id=exam-17a-q3-q1
After `channel.read`, the framing loop runs on the {{=selector thread|pool thread|logger thread}}. Each complete message becomes a {{=Runnable submitted to the executor|second read on the channel|change to the interest set}}.

In the student's design, the framing loop runs on the selector thread right after `channel.read`. Each complete message is wrapped in a `Runnable` and submitted to the executor, so each pool task receives exactly one complete message.
:::

:::check id=exam-17a-q3-q2
Where does this change do harm?

- [ ] The selector returns to `select` after the copy, and the pool scans the buffer
- [x] The selector scans a large buffer before it returns to `select`, so `accept` and other clients' reads wait
- [ ] A slow protocol lowers `ioThroughput` while `compThroughput` stays high
- [ ] The pool is given the channel before any bytes are copied

- **The harm:** if one client sends a large buffer, for example a megabyte that frames into many messages, the selector thread must scan all of it before it can return to `select`.
- **The result:** meanwhile no new client is accepted and no other client is read, because anything heavy on the selector thread stalls every client.
:::

:::check id=exam-17a-q3-q3
Which pairing of the two counters is right?

- [ ] `ioThroughput` counts finished `process` calls, and `compThroughput` counts bytes beside `read` and `write`
- [x] `ioThroughput` is bytes read plus bytes written on the selector thread, and `compThroughput` counts messages whose `process` has returned
- [ ] Both counters increase beside `read` and `write`
- [ ] Both counters increase in the pool task

- **`ioThroughput`** measures the I/O stage: the bytes read plus the bytes written, divided by the elapsed time. Its counters are updated next to `read` and `write`, on the selector thread.
- **`compThroughput`** measures the computation stage: the number of messages whose `process` call has returned, divided by the elapsed time. Its counter is updated in the pool task.
:::

:::check id=exam-17a-q3-q4
What does a slow protocol do to the two numbers?

- [ ] It lowers `ioThroughput` and leaves `compThroughput` high
- [ ] It lowers both, because they measure the same stage
- [x] It lowers `compThroughput` while `ioThroughput` stays high
- [ ] It stops `select`, so both counters freeze

The two numbers measure different stages. A slow protocol slows down the computation stage, so `compThroughput` drops, while the selector keeps moving bytes, so `ioThroughput` stays high.
:::

:::

:::problem id=exam-18a-q3 title="A saturated selector" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
The selector thread is saturated: it is busy 100% of the time. Shraga suggests adding workers to the actor pool and moving the server to a machine with more processors. Nahum's team instead adds capacity on the selector side.

:::check id=exam-18a-q3-q1
Does Shraga's change take load off this selector?

- [x] No. Those calls stay on the one selector thread, and the extra actor threads stay idle while the time sits in `select` and the byte copies
- [ ] Yes. The extra actor threads run `select`, `accept`, `read`, and `write`
- [ ] Yes. A larger machine splits that one thread across the new processors
- [ ] No. Extra workers hurt even when the pool is the saturated part

- **Why it does not help:** `select`, `accept`, `read`, and `write` all run on the single selector thread. When that thread is the bottleneck, extra worker threads have nothing to do.
- **Why more processors do not help either:** one thread can only use one processor at a time, so a bigger machine cannot split it.
:::

:::check id=exam-18a-q3-q2
Which of these hold?

- [ ] A second processor splits one selector thread by itself
- [x] Shraga's change helps when the pool is the saturated part
- [ ] Extra actor threads run `select`
- [x] Here the selector is the saturated part, so those extra workers do not take its load

Adding workers helps only when the pool is the bottleneck. Here the selector is the bottleneck, so extra workers do not reduce its load.
:::

:::check id=exam-18a-q3-q3
Leave the selector loop for {{=readiness and byte copies|framing and log writes|protocol tasks}}. Move {{=framing and every log write|select and accept|the pool lock}} out of that loop. If one thread still cannot copy bytes fast enough, split the channels across {{=several reactors|a larger actor pool|more logger threads}}.

- **Lighten the selector loop:** keep only readiness checks and byte copies in it, and move framing and every log write out of it.
- **If that is still not enough,** split the channels across several reactors, each with its own selector thread, handling its own port or its own share of the channels.
- **Keep the threads independent:** pool threads should never need the selector's lock.
:::
:::

:::problem id=exam-18b-q3 title="A misleading measurement" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
Shraga compares a thread-per-client server with a reactor by sending a few requests from his laptop. The thread-per-client server answers faster, so he tells the company to switch to it. Nahum says the conclusion is wrong.

:::check id=exam-18b-q3-q1
Which of these explain Shraga's faster thread-per-client result?

- [x] His client count is too small to pay for a thread per connection
- [ ] His run already holds a thousand stacks parked in `read`
- [x] The protocol runs on the connection's thread, with no handoff to a pool
- [ ] The reactor skips `select`, the buffers, and the queue for a few requests

- **The test is too small:** with only a few clients, the cost of a thread per connection never shows up. There are no thousands of idle threads, each holding a stack while blocked in `read`.
- **With few clients, thread-per-client really is faster:** the protocol runs directly on the connection's thread, with no handoff to a pool.
- **The reactor has fixed overhead:** `select`, buffers, and queues. This overhead only pays off when there are many connections.
:::

:::check id=exam-18b-q3-q2
A fair measurement holds {{=thousands of connections open|five requests from a laptop|one thread per core}} and counts {{=how many requests per second complete|the latency of those five requests|how many stacks the reactor allocates}}.

A fair test matches the company's real load: it keeps thousands of connections open and measures how many requests per second the server completes (its throughput). Shraga measured something else, the latency of a few requests from one laptop.
:::

:::check id=exam-18b-q3-q3
Which of these hold for the company's load?

- [ ] The reactor creates one thread for each idle connection
- [x] Under many connections, most of them idle, a thread-per-client server runs out of memory on stacks
- [x] Under a burst, a thread-per-client server creates threads with no ceiling
- [x] The reactor keeps one selector thread and a bounded pool

With many connections, most of them idle, a thread-per-client server runs out of memory for all the thread stacks, and a sudden burst makes it create threads without any limit. The reactor always uses one selector thread and a fixed-size pool, no matter how many clients connect.
:::
:::

:::problem id=exam-19a-q3 title="What an actor pool promises" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
The actor pool makes two promises for each connection.

- **One at a time:** at most one request from that connection runs at any moment.
- **In order:** if request 1 arrived before request 2, reply 1 is sent before reply 2.

:::check id=exam-19a-q3-q1
Each client has a {{=request queue|shared task list|selected-key set}} and a chain that means a task for this client is already in the pool. The selector submits a pool task only when that chain was {{=idle|busy|closed}}.

Each client has its own request queue, plus a flag (or chain) that says whether a task for this client is already in the pool. When a request arrives, the selector adds it to the client's queue, and submits a new pool task only if the client was idle.
:::

:::check id=exam-19a-q3-q2
Which of these hold?

- [ ] Two requests of one client run together on two workers
- [x] Two requests of one client never run together
- [x] They run in arrival order, so the replies are queued in that order
- [x] The selector writes those replies in queue order

- **How the task works:** it runs the protocol on the request at the head of the client's queue, queues the reply bytes for the selector to write, and then moves on to the client's next request, if there is one.
- **Why the promises hold:** only one task per client exists at a time, so two of its requests never run together. They run in arrival order, and the selector writes the replies in that same order.
:::

:::check id=exam-19a-q3-q3
Which change breaks a promise?

- [ ] Keep the chain, and let the same worker pull the next request
- [x] Submit every request to a shared pool with no per-client chain
- [ ] Queue the reply bytes for the selector to write
- [ ] Start the next request of the same client only when its queue still holds one

Submitting every request straight to a shared pool, with no per-client chain, would let two requests of the same client run at once. Throughput might rise, but both promises would be broken.
:::

:::check id=exam-19a-q3-q4
Which change is worth making?

- [ ] Drop the per-client chain so two requests of one client can run together
- [ ] Allocate a new `Runnable` for every message, even while that client's chain is busy
- [x] Keep the chain, and skip a new `Runnable` when the same worker pulls the next request
- [ ] Have the selector send reply 2 before reply 1

Keeping the chain, but letting the same worker pull the client's next request itself instead of allocating a new `Runnable`, saves work and keeps both promises. The other options break a promise.
:::
:::

:::problem id=exam-19b-q3 title="The next request on the same worker" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
This design improves the actor pool. When a worker finishes a request, it goes on to the same client's next waiting request on the same thread, without a new `Runnable`, until that client's queue is empty. The selector still does all the I/O, and the workers only run the protocol.

:::check id=exam-19b-q3-q1
The worker takes the next message under the client lock, then {{=releases the lock|calls interestOps|submits a new Runnable}}, then calls `protocol.process`, then {{=queues the reply|writes the socket|clears OP_READ}}.

The task's `run` is a loop: take the next message while holding the client's lock, release the lock, call `protocol.process`, queue the reply for the selector, and repeat. The lock is released before `process` so that the selector can keep adding messages to the queue in the meantime.
:::

:::check id=exam-19b-q3-q2
The reply bytes sit in `buf`. Which line is the bug?

```java
void run(Client client) {
    while (true) {
        Message msg;
        synchronized (client) {
            if (client.queue.isEmpty()) {
                client.running = false;
                return;
            }
            msg = client.queue.remove();
        }
        protocol.process(msg);
        client.channel.write(buf);
    }
}
```

- [ ] `client.running = false` when the queue is empty
- [ ] `client.queue.remove()` under the client lock
- [x] `client.channel.write(buf)`
- [ ] `protocol.process(msg)` after the lock is released

The bug is that a worker writes to the channel directly. In the reactor, only the selector thread may touch the channel and `interestOps`. The worker should put the reply on the client's write queue and let the selector send it.
:::

:::check id=exam-19b-q3-q3
Which of these hold?

- [x] `execute` still submits one task when the client was idle
- [ ] A second `Runnable` is allocated for a message already queued while the worker was alive
- [x] After the running flag is cleared, a new message makes the selector submit one new task
- [x] When the queue is empty, the loop clears the running flag

- **Starting a task:** `execute` still submits one task when the client was idle.
- **Ending a task:** when the queue is empty, the loop clears the running flag and exits. The next message then makes the selector submit a new task.
- **No extra `Runnable`:** a message that arrives while the worker is still running simply joins the queue, and the same worker picks it up.
:::
:::

:::problem id=exam-20a-q3 title="Logging off the selector thread" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
A `Logger` wraps an `OutputStream` and records the server's actions. Two workers may log at the same time, and the selector thread must never wait for the disk.

:::check id=exam-20a-q3-q1
Workers and the selector place a finished line, a `byte[]`, on a {{=BlockingQueue owned by the logger|write queue of the client|ByteBuffer of the channel}}. A single logger thread then {{=takes and writes the stream|calls select|changes interestOps}}.

Every thread that wants to log puts a complete line, as a `byte[]`, on a `BlockingQueue` owned by the logger. A single logger thread then `take`s lines from the queue and writes them to the stream.
:::

:::check id=exam-20a-q3-q2
Why does each log line stay whole?

- [x] One logger thread writes the lines
- [ ] Both workers write the `OutputStream`, and the disk orders the bytes
- [ ] The selector thread writes the line before the next `select`
- [ ] Each worker holds the selector lock across the write

Only one thread ever writes to the stream, so two lines can never be interleaved. And since the selector only hands lines to the queue, it never waits for the disk.
:::

:::check id=exam-20a-q3-q3
Which of these hold when the queue is bounded?

- [ ] A `put` from the selector thread is how it waits for disk space
- [x] A full queue drops log lines or counts them
- [x] The selector only offers a line when the queue has room
- [ ] Logger methods that workers call write the stream before they return

- **A full queue:** when the queue has a size limit and is full, the logger drops the new line, or counts how many were dropped.
- **The selector must not wait:** `put` blocks when the queue is full, which would stop `select`. So the selector uses `offer`, which adds the line only if there is room and otherwise returns at once.
- **Workers only enqueue:** the logger methods they call put the line on the queue and return, without writing the stream.
:::

:::check id=exam-20a-q3-q4
Where do formatting and the stream write run?

- [ ] On the selector thread, inside `select`
- [ ] On each worker, inside a lock the other workers wait on
- [ ] On the client connection, as a reply
- [x] On the logger thread, outside any lock the workers hold

Formatting and writing happen on the logger thread, outside any lock the workers hold, so a slow disk never delays a worker or the selector.
:::
:::

:::problem id=exam-24a-q3 title="Communication threads" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
A student changes `Reactor.handleReadWrite` so that the I/O for each ready key is handed to a pool of two threads, `Executors.newFixedThreadPool(2)`, named `communicationThreads`.

:::check id=exam-24a-q3-q1
Which of these make two communication threads on one selector unsafe?

- [ ] They run the protocol only on a message that has already been copied
- [x] They race on `selector.selectedKeys()`
- [x] They can change the interest set while `select` is using it
- [x] A read and a write on the same channel from two threads tear the handler's `ByteBuffer`

- **A race on the keys:** the two pool threads and the selector all touch the selected-key set and the interest sets at the same time, so the selector can throw an exception or miss an event.
- **A race on the buffer:** a read and a write on the same channel, running on two threads, can corrupt the handler's shared `ByteBuffer`.
- **The first option is safe:** running the protocol on a message that was already copied out is exactly what the worker pool is for.
:::

:::check id=exam-24a-q3-q2
Leave {{=select, accept, read, write, and interestOps|the protocol and the database query|handleReadWrite on the pool of two}} on one thread.

Everything that touches the selector or its channels, `select`, `accept`, `read`, `write`, and `interestOps`, must stay on the one selector thread.
:::

:::check id=exam-24a-q3-q3
If the pool of two is kept, what may it run?

- [ ] `handleReadWrite` itself, on keys from this selector
- [ ] `channel.read` and `channel.write`, split across the two threads
- [x] A message that has already been copied: run the protocol, then queue the reply bytes
- [ ] `interestOps`, so `select` does not see the key set

- **What the pool may do:** take a message that has already been copied out of the buffer, run the protocol on it, and queue the reply bytes.
- **But the reactor already has that:** it is exactly the job of the existing worker pool.
- **The conclusion:** the change itself, running `handleReadWrite` on a pool of two, should be rejected.
:::

:::check id=exam-24a-q3-q4
Where does a database query belong?

- [x] On that protocol task, inside the pool
- [ ] On the selector thread, before the next `select`
- [ ] On both communication threads at once
- [ ] Inside `handleReadWrite` on the pool of two

A database query is part of the protocol work, so it belongs in a protocol task in the worker pool. That way a slow query never stops `select`.
:::
:::

:::problem id=exam-24b-q3 title="A warehouse server" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
A logistics warehouse keeps data on volunteers, evacuated families, and food parcels.

- **`DB`** is thread-safe and has an empty constructor. Its `executeQuery` returns the result rows, or throws `SQLException`.
- **A client** sends a query as a string.
- **The server** must use a single `DB` for every connection, and has ten worker threads.

:::check id=exam-24b-q3-q1
Which line is the bug?

```java
public static void main(String[] args) throws Exception {
    new Reactor(Integer.parseInt(args[0]), 10,
        () -> new DBProtocol(new DB()),
        () -> new LineTokenizer()).serve();
}
```

- [ ] `Integer.parseInt(args[0])`
- [ ] The pool size `10`
- [x] `() -> new DBProtocol(new DB())`
- [ ] `() -> new LineTokenizer()`

The protocol factory runs once per connection, so `new DB()` inside it creates a separate database for every client, which is expensive and breaks the "one `DB`" rule. Instead, `main` creates one `DB`, and the factory captures it: `() -> new DBProtocol(db)`.
:::

:::check id=exam-24b-q3-q2
Which body is correct for `DBProtocol.process`?

```java
// Body A
try {
    List<String> rows = db.executeQuery(msg);
    if (rows.isEmpty()) return "Result No";
    return rows.get(0);
} catch (SQLException e) {
    return e.getMessage();
}
```

```java
// Body B
List<String> rows = db.executeQuery(msg);
return rows.toString();
```

```java
// Body C
try {
    List<String> rows = db.executeQuery(msg);
    if (rows.isEmpty()) return e.getMessage();
    return "Result No";
} catch (SQLException e) {
    return rows.get(0);
}
```

- [ ] Body B, which returns every row and does not catch `SQLException`
- [x] Body A, which returns the first row, `"Result No"`, or the error text
- [ ] Body C, which returns the error text for an empty list and the first row from the catch

Body A handles all three cases: on a non-empty result it returns `rows.get(0)`, on an empty result it returns `"Result No"`, and on an `SQLException` it returns `e.getMessage()`. Body B does not catch the exception, and Body C mixes up the branches and does not even compile.
:::

:::check id=exam-24b-q3-q3
Where does a slow query run?

- [ ] On the selector thread, before the next `select`
- [ ] Inside the `DB` constructor, once per connection
- [x] On a worker in the pool of 10, while the selector thread stays in `select`
- [ ] On a new thread created for that query alone

The course's reactor runs `process` in the pool of 10 workers. A slow query therefore occupies one worker, while the selector thread keeps serving everyone else from `select`.
:::

:::check id=exam-24b-q3-q4
Which of these hold?

- [x] `DB` is thread-safe, so the ten workers may call it
- [ ] The protocol factory should construct a new `DB` for each connection
- [x] One `DB` is created in `main` and captured by the protocol

`DB` is thread-safe, so all ten workers may call the same instance at once. That one `DB` is created in `main` and captured by the protocol factory.
:::
:::

:::problem id=exam-24c-q3 title="A reply of another type" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
In this design, a client sends a message of one type and receives a reply of a different type.

- **`DB.executeQuery`** is thread-safe and returns an `ArrayList<String>`.
- **`DBServer`** uses the existing `BaseServer` and `ObjectEncoderDecoder`.
- **One `DB`** serves every client.

:::check id=exam-24c-q3-q1
`MessagingProtocol<T>` becomes {{=MessagingProtocol<T, R>|MessagingProtocol<T>|MessageEncoderDecoder<T>}}, and `process` returns {{=R|T|void}}.

The protocol needs a second type parameter for the reply: `MessagingProtocol<T, R>`, where `process` takes a `T` and returns an `R`.
:::

:::check id=exam-24c-q3-q2
Which of these hold?

- [ ] The selector loop gains a second thread for the reply type
- [x] The handler reads with an encoder-decoder of `T` and writes with an encoder-decoder of `R`, or one decoder understands both
- [x] The reactor's type arguments follow that split
- [ ] The reply type has to stay `T`

The connection handler now decodes incoming messages as `T` and encodes replies as `R`, either with two encoder-decoders or with one that understands both, and the reactor's type parameters change to match. The selector loop itself does not change.
:::

:::check id=exam-24c-q3-q3
Which signature completes `Command`?

```java
interface Command {
    {{=R execute(Context ctx)|void execute()|T process(String msg)}};
}
```

Each command returns a reply of type `R`, so the signature is `R execute(Context ctx)`. `RemoteCommandInvocationProtocol` holds the shared context, receives a decoded `Command`, calls `execute` on it, and returns the result as the reply.
:::

:::check id=exam-24c-q3-q4
`main` builds one `DB` and one `BaseServer`. The pool size is {{=11|10|1}}. The protocol factory is {{=() -> new RemoteCommandInvocationProtocol(db)|() -> new RemoteCommandInvocationProtocol(new DB())|ObjectEncoderDecoder::new}}. The encoder factory is {{=ObjectEncoderDecoder::new|LineTokenizer::new|() -> new DB()}}.

- **`main`** creates one `DB` and one `BaseServer`, with a pool size of 11 (as in the official solution), the protocol factory `() -> new RemoteCommandInvocationProtocol(db)`, and the encoder factory `ObjectEncoderDecoder::new`.
- **The query path:** the query command's `execute` calls `db.executeQuery` inside a pool task, and the returned list is the reply object, which the encoder serializes and sends.
:::
:::

:::problem id=exam-20b-q3 title="Store prices" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
`Stores` maps each store's name to the prices of its products.

- **Commands** arrive through the command-invocation protocol, and all run on one shared `Stores` object, inside a Reactor on port 7777.
- **`GetProductPrices`** takes a product name, and returns each store's price for that product.

:::check id=exam-20b-q3-q1
Which `execute` body is correct?

- [ ] `return stores.getProductsOfStore(product).toString();`
- [x] Walk `stores.getStores()`, and append `store=price` when `getProductsOfStore(store).get(product)` is not null
- [ ] Open a socket to port 7777 inside `execute` and write the product name

- **`execute` receives the shared `Stores` object.**
- **It goes over every store** in `stores.getStores()`, and looks up the product's price with `stores.getProductsOfStore(store).get(product)`.
- **When the store sells the product,** meaning the price is not null, it appends `store=price` to the result string, which it then returns.
:::

:::check id=exam-20b-q3-q2
`main` creates `new StoresImpl()` {{=once|per connection|inside execute}}.

`main` creates `Stores stores = new StoresImpl()` exactly once, and passes that same object to the protocol factory, so every connection works on the same data.
:::

:::check id=exam-20b-q3-q3
Which of these hold for the Reactor and the protocol?

- [x] The call is `new Reactor(7777, 10, () -> new CommandProtocol(stores), tokenizerFactory)`
- [ ] Each connection constructs a fresh `StoresImpl`
- [x] The protocol parses a line into a `Command<Stores>` and calls `execute(stores)`

`main` creates one `StoresImpl`, then starts `new Reactor(7777, 10, () -> new CommandProtocol(stores), tokenizerFactory)`. For each line, the protocol parses a `Command<Stores>` and calls `execute(stores)`. Creating a fresh `StoresImpl` per connection would give each client its own, separate data.
:::

:::check id=exam-20b-q3-q4
The methods of `StoresImpl` are synchronized, or the map is a {{=concurrent map|private map|socket}}, because the Reactor runs several commands at once on this one object.

The Reactor's worker pool runs several commands at the same time on this one shared object. So either the methods of `StoresImpl` must be `synchronized`, or the map must be a concurrent map such as `ConcurrentHashMap`.
:::
:::

The reactor only moves bytes. The next chapters cover what those bytes carry.

- **[Serialization](topic:serialization):** how bytes become objects, and objects become bytes.
- **[Persistence](topic:persistence):** the database that the protocol tasks query.
