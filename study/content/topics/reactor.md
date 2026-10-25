---
id: reactor
title: Server design and the reactor
blurb: "The protocol and the general server, four concurrency models, the reactor, and the actor thread pool."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 10 - Networking.pptx"
  - "materials/sessions/PS9 2026.pptx"
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

This chapter turns the print server into a general server pattern. The pattern is built from two parts, and each part is a parameter.

- **The protocol:** the "language" the server speaks, split into encoding and framing on one side, and the meaning of the messages on the other.
- **The concurrency model:** how the server manages conversations with several clients at once, from a single thread up to the reactor.
- **Synchronization inside the reactor:** keeping the messages of each client in order, with the actor thread pool, and keeping the selector's registrations on its own thread.

## The protocol

A protocol defines the rules of a conversation between two processes. In other words, it is the shared "language" in which they speak.

What does a protocol include? To understand that, think for a moment about what a human language is made of.

- **The way letters turn into words** (morphology).
- **The way words turn into a sentence,** including the structure of the sentence (syntax).
- **The meaning of the sentence that was said** (semantics).
- **The relation between different sentences in a conversation** (pragmatics, the theory of conversation).
- **The decision when the conversation is over** (pragmatics, the theory of conversation).

So a protocol fixes:

- **encoding:** the way in which a message object turns into an array of bytes,
- **framing:** the way bytes are grouped into a "message" for the receiver,
- **syntax:** the internal structure of the different messages,
- **semantics:** what is expected to be done in response to a message,
- **synchronization:** constraints on the order of the messages that are received.

**Examples:**

1. **The current print server.**
   - **Encoding:** according to the implementation of `getBytes` in Java.
   - **Framing:** a newline as the delimiter.
   - **Syntax:** an internal structure of just a string to print.
   - **Semantics:** one meaning only, print the message.
   - **Synchronization:** no constraints, you can always send a string to print.
2. **A price server** (a server that finds the prices of a given product in different stores).
   - **Encoding:** messages of type string, encoded into bytes in UTF-8.
   - **Framing:** the first two bytes in every message state its length.
   - **Syntax and semantics:**
     - `QUERY product` ⇒ `[<store price> ...]`
     - `BUY product store` ⇒ `SUCCESS` or `FAIL`
   - **Synchronization:** you cannot buy a product before you checked its price.
3. **HTTP** (the rules of conversation between a web server and its clients).
4. **STOMP** (in the assignment).

### Two interfaces for the protocol

Define these aspects as two interfaces.

- **`MessageEncoderDecoder`** handles encoding and framing.
- **`MessagingProtocol`** handles syntax, semantics, and synchronization.

The server will then be defined on the basis of these interfaces.

```java
public interface MessageEncoderDecoder<T> {
    byte[] encode(T message);
    T decodeNextByte(byte nextByte);
}

```

This interface fixes how a message turns into an array of bytes, including a mechanism for the reader to recognize that the message has ended: the method `encode`. A reader of an array of bytes can extract messages from it with the method `decodeNextByte`, which returns a message once its last byte has arrived, and `null` before that.

Implement this interface for the print protocol above:

```java
public class LineMessageEncoderDecoder implements MessageEncoderDecoder<String> {

    private List<Byte> bytes = new LinkedList<Byte>();

    @Override
    public byte[] encode(String message) {
        return (message + "\n").getBytes("UTF-8");
    }

    @Override
    public String decodeNextByte(byte nextByte) {
        if (nextByte == '\n') {
            String ret = new String(Bytes.toArray(bytes), "UTF-8");
            bytes.clear();
            return ret;
        }
        bytes.add(nextByte);
        return null;
    }
}

```

The second interface fixes what must be done for a given message (the method `process`), and how you know that the conversation has ended (the method `shouldTerminate`).

```java
public interface MessagingProtocol<T> {
    T process(T msg);
    boolean shouldTerminate();
}

```

Implement this interface for the print protocol:

```java
public class PrintingProtocol implements MessagingProtocol<String> {

    private boolean shouldTerminate = false;

    @Override
    public String process(String msg) {
        if (msg.equals("bye!"))
            shouldTerminate = true;
        else
            System.out.println(msg);
        return null;
    }

    @Override
    public boolean shouldTerminate() {
        return shouldTerminate;
    }
}

```

### The connection handler and the base server

On the basis of these two interfaces, you can now define a class that carries out **the management of a conversation with a given client according to a given protocol**: the `ConnectionHandler` class, which carries out the conversation with a client in its `run` method.

```java
public class ConnectionHandler<T> implements Runnable {
    private final Socket sock;
    private final MessageEncoderDecoder<T> encdec;
    private final MessagingProtocol<T> protocol;

    public ConnectionHandler(Socket sock, MessageEncoderDecoder<T> reader, MessagingProtocol<T> protocol) {
        this.sock = sock;
        this.encdec = reader;
        this.protocol = protocol;
    }

    @Override
    public void run() {
        int b;
        while (!protocol.shouldTerminate() && (b = sock.getInputStream().read()) >= 0) {
            T msg = encdec.decodeNextByte((byte) b);
            if (msg != null) {
                T ans = protocol.process(msg);
                if (ans != null)
                    sock.getOutputStream().write(encdec.encode(ans));
            }
        }
    }
}

```

Now you can define the server program, according to the print pattern: connect a client, define a `ConnectionHandler` that manages the conversation with the client by running its `run` method, and so on. That pattern is carried out in the `serve` method.

```java
class BaseServer {
    private final int port;
    private final Supplier<MessagingProtocol> protocolFactory;
    private final Supplier<MessageEncoderDecoder> encdecFactory;

    public BaseServer(int port,
                      Supplier<MessagingProtocol> protocolFactory,
                      Supplier<MessageEncoderDecoder> encdecFactory) {
        this.port = port;
        this.protocolFactory = protocolFactory;
        this.encdecFactory = encdecFactory;
    }

    public void serve() {
        ServerSocket serverSock = new ServerSocket(port);
        while (!Thread.currentThread().isInterrupted()) {
            Socket clientSock = serverSock.accept();
            ConnectionHandler handler = new ConnectionHandler(
                clientSock,
                encdecFactory.get(),
                protocolFactory.get());
            handler.run();
        }
    }
}

```

Run the server pattern for the print server:

```java
class TCPPrintServer {
    public static void main(String[] args) {
        int port = Integer.parseInt(args[0]);
        new BaseServer(port,
                       () -> new PrintingProtocol(),
                       () -> new LineMessageEncoderDecoder())
            .serve();
    }
}

```

- **Why factories (`Supplier`):** every client gets its own encoder-decoder and its own protocol object, because each one keeps the state of one conversation (the bytes of a half-read message, or whether `bye!` arrived).

## The server's concurrency model

As noted before, the second part of the server pattern is the way the server manages a conversation with several clients at once.

In the existing code of `BaseServer`, the server talks to only one client at a time (by calling the `run` method of that client's `ConnectionHandler`). That decision should become a parameter of the server, chosen by the user.

So define the way a conversation with a client is managed, alongside the other clients, given the `ConnectionHandler` of the client, as an abstract method `execute`, and carry it out in different ways, according to different concurrency models.

```java
abstract class BaseServer {
    private final int port;
    private final Supplier<MessagingProtocol> protocolFactory;
    private final Supplier<MessageEncoderDecoder> encdecFactory;

    abstract protected void execute(ConnectionHandler handler);

    public BaseServer(int port,
                      Supplier<MessagingProtocol> protocolFactory,
                      Supplier<MessageEncoderDecoder> encdecFactory) {
        this.port = port;
        this.protocolFactory = protocolFactory;
        this.encdecFactory = encdecFactory;
    }

    public void serve() {
        ServerSocket serverSock = new ServerSocket(port);
        while (!Thread.currentThread().isInterrupted()) {
            Socket clientSock = serverSock.accept();
            ConnectionHandler handler = new ConnectionHandler(
                clientSock,
                encdecFactory.get(),
                protocolFactory.get());
            execute(handler);
        }
    }
}

```

Now look at the different possible implementations of the `execute` method, meaning different implementations of the server's concurrency model.

### 1. A single thread

The server is based on one thread. That thread waits for a client to connect, serves it until the end of the conversation, and comes back again.

```java
class SingleThreadServer extends BaseServer {
    protected void execute(ConnectionHandler handler) {
        handler.run();
    }
}

```

- **The advantage:** simplicity. It needs no resources.
- **The drawback:** availability. Only one client gets service at a given moment.
- **It may fit a server that carries out a very simple protocol,** such as a time server, when there are not many clients at any given moment. But in general it is not enough.

### 2. A thread for every client

```java
class ThreadPerClientServer<T> extends BaseServer<T> {
    protected void execute(ConnectionHandler<T> handler) {
        new Thread(handler).start();
    }
}

```

- **The advantage:** availability (seemingly). Every client has a thread of its own, which handles it until the end of the conversation.
- **The drawbacks:** there is no reuse of existing threads (after a thread finishes handling a client, it ends its life, and a new thread is created for the next client), and scalability: for a large number of clients, the server may crash for lack of resources to create more threads.
- **A model like this fits only cases in which the number of clients is bounded,** and not too large (relative to the resources of the hardware and the operating system). In general, that is not very practical.

### 3. A thread pool

This approach balances availability against scalability, while reusing existing threads, by defining a fixed pool of threads that run all the time, each handling one client at a time.

The number of threads in the pool is fixed according to the expected number of clients, and according to the server's resources (hardware, operating system). The number of threads in the pool could change according to conditions, but in each case it is fixed, which means a new thread is not created for every new client.

You could implement a fixed pool of threads like this, following the producer-consumer pattern:

```java
class ThreadPool {
    BoundedQueue<Runnable> taskQueue;
    List<Thread> threads;

    ThreadPool(int numThreads) {
        taskQueue = new BlockingQueue<Runnable>();
        threads = new LinkedList<Thread>();
        for (int i = 0; i < numThreads; i++) {
            Thread t = new Thread(() -> {
                while (!Thread.interrupted())
                    taskQueue.remove().run();
            });
            threads.add(t);
            t.start();
        }
    }

    public void submit(Runnable task) { taskQueue.add(task); }

    public void shutdown() {
        for (Thread t : threads)
            t.interrupt();
    }
}

```

A thread pool like this is implemented today in Java's standard JDK, as the `ExecutorService` class.

```java
class FixedThreadPoolServer<T> extends BaseServer<T> {
    ExecutorService pool;

    FixedThreadPoolServer(int port,
                          Supplier<MessagingProtocol> protocolFactory,
                          Supplier<MessageEncoderDecoder> encdecFactory,
                          int numThreads) {
        super(port, protocolFactory, encdecFactory);
        pool = Executors.newFixedThreadPool(numThreads);
    }

    protected void execute(ConnectionHandler<T> handler) {
        pool.submit(handler);
    }
}

```

- **The advantages:** controlled availability, according to the system's capabilities, while reusing existing threads.
- **The drawbacks:** utilization and fairness.
- **An analogy:** the service in a bank branch, which works according to model 3, a pool of threads, or clerks.
- **Utilization:** since the task run by the thread (the `run` method of the `ConnectionHandler`) is the management of the whole conversation with the client, including many I/O accesses (mainly reading from and writing to the socket), the threads move to the Blocked state while waiting for the clients they handle, even though there may be other clients waiting in the queue for a thread.
- **Fairness:** the server's concurrency model is designed so that a small group of clients gets complete service (until they finish the conversation), while the other clients get no service at all.

This model is common in real life, in practically every system that serves clients. The fourth model, below, comes from that model and fixes its two drawbacks, fairness and utilization of the processor.

### 4. The reactor

As noted, the reactor model deals with the problems of fairness and utilization of the processor.

**Broadly:**

- **Fairness:** limit the task given each time to a thread in the pool to **handling one message of a client** (or a small number of messages), instead of managing the whole conversation with the client.
- **Utilization:** separate the management of the **communication** with the clients from **carrying out requests** according to the protocol. In other words, one of the threads manages all the communication with the clients (in particular, it reads bytes from them and writes bytes to them), and all the other threads carry out the clients' requests in memory.

**The problem:** there is a heavy load on the communication thread.

- **It must accept new clients** (by calling `accept` on the `ServerSocket`).
- **It must read bytes from the connected clients** (by calling `read` on the `InputStream` of their `Socket`).
- **It must write bytes to the connected clients** (by calling `write` on the `OutputStream` of their `Socket`).

The problem gets worse because of the work: each attempt to read, write, or accept from a client is blocked until it succeeds (to connect a client, to read or write at least one byte), while the communication must still be managed for other clients.

- **So turn the communication channels** (accepting, reading, writing) **into non-blocking I/O.** In this implementation, these operations do not wait. They read what is there right now (returning 0 if nothing is there), write what can be written right now (returning 0 if nothing can be written), and accept whoever is connecting right now (returning `null` if nobody is connecting).
- **Still,** it would be very hard for the communication thread to run endlessly over a large number of clients, checking each time whether there is anything to accept, read from them, or write to them.
- **So connect the communication thread to a component,** called a **Selector**, that sends it an alert when it needs to accept, read, or write for one of the clients.

This way, one communication thread can handle managing the communication with all the clients, while leaving the processing of the messages in memory to the worker threads in the pool.

![The reactor loop: one selector thread, ready keys, and a pool only for protocol work](../../web/public/figures/reactor-loop.svg)

The thread that calls `accept` must be free again quickly, to accept the next client.

- **Blocking that thread stalls everyone:** while it waits in a read, a framing step, or a database query, no new client is accepted, and no other ready client is read.

**Thread-per-client** moves the blocking work to a separate thread for each connection.

- **Its weakness:** it does not scale to thousands of connections. Each thread needs its own stack, even when its client is idle, and the processor wastes time switching among them.

**The reactor** keeps one thread waiting in `select` (in Java NIO, on a `Selector`), and has it handle only the non-blocking channels that are ready right now.

- **The events it handles:** a new connection (`OP_ACCEPT`), bytes to read (`OP_READ`), and room to write (`OP_WRITE`), across many channels.
- **That thread only copies bytes,** then goes straight back to `select`. Any heavy call on it would stall every client.
- **The heavy protocol work** goes to a fixed pool of worker threads, shared by all connections.

These are the Java NIO classes the reactor is built from.

### The components and the code

**Helper classes from Java's `nio` library:**

- `Channel`, `SelectableChannel`,
- `ServerSocketChannel`, `SocketChannel`, [`DatagramSocketChannel`].

I/O events that happen in a `SelectableChannel` are detected by the operating system, and by the `Selector`.

- **An ACCEPT event** happens when the transport layer receives a new client connection.
- **A READ event** happens when the buffer of incoming bytes has at least one byte.
- **A WRITE event** happens when the buffer of outgoing bytes has at least one free cell.

And also `Selector`, `SelectionKey`, and `ByteBuffer`.

:::definition id=def-reactor title="Java NIO pieces of the reactor" source="materials/lectures/Chapter 11 - Reactor.pptx"

- **`Selector`:** the Java NIO object that the reactor's thread waits on. `select` returns when at least one registered channel is ready, and the thread then handles the ready channels.
- **`ServerSocketChannel` and `SocketChannel`:** the server and client channels. They can be made non-blocking with `configureBlocking(false)`.
- **`SelectionKey`:** the record of one channel's registration with the selector. Its interest set says which operations to watch (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`), and `readyOps()` says which of them are ready now.
- **`ByteBuffer`:** a block of memory that data is read into and written out of.
:::

**The `Reactor` class, the central class.**

- **Its main fields:** `Selector`, `Executor`, `readerFactory`, `protocolFactory`.
- **Initialization:** define the `Selector` and the `Executor`. Define a `ServerSocketChannel`, in non-blocking mode, on the required port. Register the `ServerSocketChannel` in the `Selector` for ACCEPT events (with no attached object).
- **Its methods:**
  - **`serve`:** run by the communication thread, in an endless loop: wait until one of the events registered in the `Selector` happens, and for every channel in which an event happened, handle the event according to its kind: accept, read, write.
  - **`handleAccept`:** run by the communication thread when there is an `OP_ACCEPT` event. It runs `accept` on the `ServerSocketChannel`, and registers the returned `SocketChannel` in the `Selector` for `OP_READ` events, with an attached object: a `ConnectionHandler` created for that client.
  - **`handleRead`:** run by the communication thread when there is an `OP_READ` event. It calls the `continueRead` method of the client's `ConnectionHandler`, and adds the returned task to the `Executor`'s queue of tasks.
  - **`handleWrite`:** run by the communication thread when there is an `OP_WRITE` event. It calls the `continueWrite` method of the client's `ConnectionHandler`.
  - **`updateInterestOps`:** run by the communication thread when it changes the registration from `OP_READ | OP_WRITE` to `OP_READ` (after all the replies to the client were written, and its `writeQueue` is empty). Run by a worker thread (from the `Executor`) after it adds a reply to the client's `writeQueue`, changing the registration to `OP_READ | OP_WRITE`. It changes the registration of events to listen for in the `Selector`.

```java
public class Reactor {

    private int port;
    private Supplier<MessagingProtocol<T>> protocolFactory;
    private Supplier<MessageEncoderDecoder<T>> readerFactory;
    private ExecutorService pool;
    private Selector selector;
    ...

    public void serve() {
        // Initialization
        // 1. Create ServerSocket channel on the given port, in non-blocking mode
        ServerSocketChannel serverSock = ServerSocketChannel.open();
        serverSock.bind(new InetSocketAddress(port));
        serverSock.configureBlocking(false);
        // 2. Register the socket to the Selector for ACCEPT event
        serverSock.register(selector, SelectionKey.OP_ACCEPT);

        // Main loop
        while (!Thread.currentThread().isInterrupted()) {
            selector.select();   // wait for some event (in 'blocked' state)
            for (SelectionKey key : selector.selectedKeys()) {   // for each event
                if (!key.isValid()) {
                    continue;
                } else if (key.isAcceptable()) {
                    handleAccept(serverSock, selector);
                } else {   // read and/or write event
                    handleReadWrite(key);
                }
            }
            selector.selectedKeys().clear();   // clear the selected keys set
        }
        pool.shutdown();
    }

    private void handleAccept(ServerSocketChannel serverChan, Selector selector) throws IOException {
        SocketChannel clientChan = serverChan.accept();
        clientChan.configureBlocking(false);
        final NonBlockingConnectionHandler handler = new NonBlockingConnectionHandler(
            readerFactory.get(),
            protocolFactory.get(),
            clientChan,
            this);
        clientChan.register(selector, SelectionKey.OP_READ, handler);
    }

    private void handleReadWrite(SelectionKey key) {
        // Get the attached ConnectionHandler
        NonBlockingConnectionHandler handler = (NonBlockingConnectionHandler) key.attachment();
        // Case 1: read event
        if (key.isReadable()) {
            Runnable task = handler.continueRead();
            if (task != null)
                pool.submit(task);
        }
        // Case 2: write event
        if (key.isWritable())
            handler.continueWrite();
    }

    void updateInterestedOps(SocketChannel chan, int ops) {
        SelectionKey key = chan.keyFor(selector);
        key.interestOps(ops);
        selector.wakeup();
    }
}

```

**The `NonBlockingConnectionHandler` class.**

- **Its fields:** `SocketChannel`, `encDec`, `protocol`, and `Queue<ByteBuffer> writeQueue`.
- **Its methods:**
  - **`continueWrite`:** run by the communication thread when there is an `OP_WRITE` event. It takes `ByteBuffer`s out of the `writeQueue` and writes them to the `SocketChannel`, until it can write no more (everything is non-blocking). If no more bytes are left in the `writeQueue`, it returns the registration in the `Selector` to `OP_READ` only.
  - **`continueRead`:** run by the communication thread when there is an `OP_READ` event. It reads a `ByteBuffer` from the client's `SocketChannel` with the `read` method, and returns a task that handles the array of bytes, as a `Runnable` object, whose `run` task is:
    - run by a worker thread (from the `Executor`),
    - with the fields `ByteBuffer`, `encDec`, `protocol`, `writeQueue`,
    - extract messages from the `ByteBuffer` with `encDec` (byte after byte),
    - carry out every message according to the `protocol`,
    - move the reply to every message, as a `ByteBuffer`, to the client's `writeQueue`, while updating the client's registration in the `Selector` to `READ | WRITE`.

```java
public class NonBlockingConnectionHandler {

    private static final int BUFFER_ALLOCATION_SIZE = 1 << 13;   // 8k
    private final MessagingProtocol<T> protocol;
    private final MessageEncoderDecoder<T> encdec;
    private final Queue<ByteBuffer> writeQueue = new LinkedList<ByteBuffer>();
    private final SocketChannel chan;
    private final Reactor reactor;
    ...

    public Runnable continueRead() {
        ByteBuffer buf = ByteBuffer.allocateDirect(BUFFER_ALLOCATION_SIZE);

        if (chan.read(buf) > 0) {   // 1. Read bytes from the client's channel
            buf.flip();
            return () -> {   // 2. Return a task for the executor, based on the bytes read from the client
                while (buf.hasRemaining()) {
                    T nextMessage = encdec.decodeNextByte(buf.get());
                    if (nextMessage != null) {
                        T response = protocol.process(nextMessage);
                        if (response != null) {
                            writeQueue.add(ByteBuffer.wrap(encdec.encode(response)));
                            reactor.updateInterestOps(chan,
                                SelectionKey.OP_READ | SelectionKey.OP_WRITE);
                        }
                    }
                }
            };
        } else {   // read byte is -1, so the client disconnected
                   // (0 is not possible, since the read is applied after an OP_READ event)
            close();
            return null;
        }
    }

    public void close() {
        try {
            chan.close();
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    public void continueWrite() {
        while (!writeQueue.isEmpty()) {
            ByteBuffer top = writeQueue.peek();
            chan.write(top);
            if (top.hasRemaining())
                return;
            else
                writeQueue.remove();
        }
        // the while-loop can break due to an exception (see the full code in the website)
        if (writeQueue.isEmpty()) {
            if (protocol.shouldTerminate()) close();
            else reactor.updateInterestOps(chan, SelectionKey.OP_READ);
        }
    }
}

```

The interest set needs care, especially `OP_WRITE`.

:::trap
Leaving `OP_WRITE` set when there is nothing to send makes `select` spin.

- **Why:** a channel is almost always ready for writing, so `select` returns immediately, finds nothing to do, and loops again, burning a whole CPU core.
- **The fix:** set `OP_WRITE` only while the write queue holds bytes, and clear it as soon as the last of them has been written.
:::

:::check id=chk-write-interest
A channel's write queue is empty, and `OP_WRITE` is still set. What does the selector thread do?

- [ ] It blocks in `select` until the client sends a byte
- [x] It spins, because the channel is already ready for writing
- [ ] It closes the channel

- **Why it spins:** a channel with free space in its send buffer counts as ready for writing, so `select` returns immediately, over and over.
- **The fix:** clear `OP_WRITE` from the interest set, and set it again only when a reply is waiting in the write queue.
:::

### ByteBuffer indexes

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

## Synchronization in the reactor

Look at a number of "issues" around the current pattern. Since this is a concurrent system, based on several threads running concurrently, you must check the scenarios in which different threads reach shared information at the same time.

You can classify the meeting points between threads into two kinds.

### 1. The communication thread and a worker thread

The `writeQueue` in the `NonBlockingConnectionHandler`, which holds the replies to send to a given client, is reached at the same time by the communication thread and by a worker thread: while the communication thread removes a `ByteBuffer` to send to the client through the `Socket`, a worker thread may add a new reply to the same client's `writeQueue`.

- **So the `writeQueue` must be synchronized:**

```java
public class NonBlockingConnectionHandler {
    ...
    private final Queue<ByteBuffer> writeQueue = new ConcurrentLinkedQueue<ByteBuffer>();
    ...
}

```

Remember that a synchronized class makes every operation safe by itself, but if there is a logical connection between several operations on the structure (such as performing an `if` that refers to the structure's state, and then an operation according to it), you must still synchronize from outside around the series of operations. There are two such cases in the `continueWrite` method.

```java
while (!writeQueue.isEmpty()) {
    // take bytes from writeQueue and write them to the client's socket
}

```

If a worker thread adds a new reply to this client between the check of the condition and the exit from the loop, nothing bad happens, because the client's registration is `READ | WRITE`, so the communication thread will soon go back to `select`, wake up at once because the client is ready for writing, and come back to `continueWrite`.

```java
if (writeQueue.isEmpty()) {
    // change the registration to READ only
}

```

Here there may be a problem. A worker thread may add a reply to this client after the check `if (writeQueue.isEmpty())` came out empty, while the communication thread changes the registration to `READ` only. That way, the client's thread will not wake up from `select` until the client's bytes arrive (it is not certain that will happen at all, since the client is waiting for the reply to a request it sent), and in any case it will not handle writing the reply to the client.

- **So you should synchronize this `if` block.** But you will see later that this scenario is solved in another way, because of a mechanism added to the pattern for another reason.

### 2. Two worker threads

This scenario is possible when you receive several `ByteBuffer`s from the client in different reads, and they are handled concurrently by two tasks in the `Executor`. The bytes of the messages may get mixed in the client's shared `encDec` in its connection handler.

- **So you must synchronize the access to the client's connection handler.**

**A first attempt:** synchronize on the connection handler in the `run` method of the worker thread's task.

```java
public Runnable continueRead() {
    ...
    return () -> {   // 2. Return a task for the executor, based on the bytes read from the client
        synchronized (NonBlockingConnectionHandler.this) {
            while (buf.hasRemaining()) {
                T nextMessage = encdec.decodeNextByte(buf.get());
                if (nextMessage != null) {
                    T response = protocol.process(nextMessage);
                    if (response != null) {
                        writeQueue.add(ByteBuffer.wrap(encdec.encode(response)));
                        reactor.updateInterestOps(chan,
                            SelectionKey.OP_READ | SelectionKey.OP_WRITE);
                    }
                }
            }
        }
    };
    ...
}

```

- **The drawback:** the order in which the messages are carried out is still not kept, in the order the bytes were sent. The bytes are indeed read in order (by the TCP protocol), and they arrive in order as tasks to the `Executor` (there is one communication thread), and they are even taken in order from the queue of tasks in the `Executor` by the worker threads. But there is no guarantee of the scheduling: the thread that took the first array of bytes may run its task only after the thread that took the second array of bytes.
- **Moreover,** there is a scenario in which the server carries out messages the client never sent, and on the other hand does not carry out messages the client did send. If the first `ByteBuffer` is `AB;C` and the second is `D;`, and the thread that took the second task is scheduled first, it carries out the message `D`, which was not sent, and the message `CD` is not carried out.

**A second attempt:** extend the synchronization of the client, the connection handler, to also cover removing its tasks from the queue.

For that, keep a data structure that maps each connection handler to the list of tasks to carry out for it. Define the task handed to the threads in the `Executor` as removal, under the synchronization of the connection handler, of the first task for the client, and running it (running its `run`).

```java
class Reactor {
    ...
    private Map<NonBlockingConnectionHandler, Queue<Runnable>> handler2tasks =
        new ConcurrentHashMap<NonBlockingConnectionHandler, Queue<Runnable>>();
    ...

    private void handleAccept(ServerSocketChannel serverChan, Selector selector) throws IOException {
        SocketChannel clientChan = serverChan.accept();
        clientChan.configureBlocking(false);
        final NonBlockingConnectionHandler handler = new NonBlockingConnectionHandler(
            readerFactory.get(),
            protocolFactory.get(),
            clientChan,
            this);
        clientChan.register(selector, SelectionKey.OP_READ, handler);
        handler2tasks.put(handler, new ConcurrentLinkedQueue<Runnable>());
    }

    private void handleReadWrite(SelectionKey key) {
        NonBlockingConnectionHandler handler = (NonBlockingConnectionHandler) key.attachment();
        if (key.isReadable()) {
            Runnable task = handler.continueRead();
            if (task != null) {
                handler2tasks.get(handler).add(task);
                pool.submit(() -> {
                    synchronized (handler) {
                        tasks.remove(0).run();
                    }
                });
            }
        } else {
            handler.continueWrite();
        }
    }
}

```

The task defined for the threads in the `Executor` is: in a synchronized way on the connection handler, remove the first task in the list of tasks for the client, and run it (run its `run`). This way, there is no importance to the scheduling of the threads in the `Executor`: whoever runs first takes the first task and runs it, without allowing other threads to run other tasks of the same client.

- **The drawback:** this guarantees correctness, but it is not efficient in terms of liveness. Running several tasks of the same client concurrently moves all the threads except one to waiting, even though there are other clients that could be handled at that time.

**A third attempt:** manage the clients' tasks in the `Executor` so that two tasks of the same client are never carried out at the same time. In other words, define a simple protocol, the "envelope", for the clients' tasks: the tasks are kept in a table, in a way that never puts two tasks of the same client in the `Executor`'s queue of tasks.

Implement this in general (not only for the scenario of tasks in a server) with the **`ActorThreadPool`** design pattern, which implements an `ExecutorService` under a constraint of this kind:

- **a mapping from each "actor"** (in our case, the clients, the connection handlers) **to its current tasks** that need to be carried out,
- **a list that says which "actors"** (connection handlers) **are being handled right now** by threads in the `Executor`,
- **a task of an actor is added to the `Executor`'s queue of tasks only if it has no other tasks in the queue.**

The task defined for the threads in the `Executor`:

1. carry out the actor's first current task,
2. add the next task of that client to the end of the `Executor`'s queue. If there are no more tasks for the actor, remove it from the list of active actors.

### The ActorThreadPool class

**Design.**

- **`submit(T actor, Runnable task)`:**
  - add the task to the client's list of tasks,
  - if the client is not active (none of its tasks is being carried out by the `Executor`): add to the `Executor` a task made of running the task's `run`, and then running `complete` for this client (which adds the client's next task to the `Executor`). Adding such a task is defined in the method `execute`.
- **`execute(Runnable task, T actor)`:**
  - a helper function that adds a new task to the `Executor`, which includes:
    - running the `run` method of the given task,
    - calling `complete`, which adds the client's next task to the `Executor`.
- **`complete(T actor)`:**
  - if the actor has no more tasks, remove it from the list of active actors (`playingNow`),
  - otherwise, add a new task to the `Executor` that includes running the next task, followed by `complete` (that is, a call to the method `execute`).

```java
public class ActorThreadPool<T> {

    private final Map<T, Queue<Runnable>> acts;
    private final Set<T> playingNow;
    private final ExecutorService threads;   // the 'executor'

    public ActorThreadPool(int threads) {
        this.threads = Executors.newFixedThreadPool(threads);
        acts = new HashMap<T, Queue<Runnable>>();
        playingNow = new HashSet<T>();
    }

    public void submit(T act, Runnable task) {
        if (!playingNow.contains(act)) {
            playingNow.add(act);
            // add a new task to the executor: <r.run(); complete(...);>
            execute(task, act);
        } else {
            // add the new task r to the tasks of act
            pendingRunnablesOf(act).add(task);
        }
    }

    public void shutdown() {
        threads.shutdownNow();
    }

    private Queue<Runnable> pendingRunnablesOf(T act) {
        // get the task list of the given actor
        Queue<Runnable> pendingRunnables = acts.get(act);
        if (pendingRunnables == null)
            acts.put(act, pendingRunnables = new LinkedList<Runnable>());
        return pendingRunnables;
    }

    private void execute(Runnable task, T act) {
        threads.submit(() -> {
            try {
                task.run();
            } finally {
                complete(act);
            }
        });
    }

    private void complete(T act) {
        Queue<Runnable> pending = pendingRunnablesOf(act);
        if (pending.isEmpty())
            playingNow.remove(act);
        else
            // add a new task for this actor, in the task queue of the executor
            execute(pending.poll(), act);
    }
}

```

**Synchronization.** In our use of `ActorThreadPool`:

- **Different threads reach the `acts` table,** in particular in the method `pendingRunnablesOf`. So define it as a `ConcurrentHashMap`.
- **The communication thread runs `submit`,** meaning it adds a task to process a `ByteBuffer` that was read for some client (connection handler). A worker thread runs `complete` after it finishes carrying out a task of some client. So both methods are synchronized on the actor.

```java
public class ActorThreadPool<T> {

    private final Map<T, Queue<Runnable>> acts;
    private final Set<T> playingNow;
    private final ExecutorService threads;   // the 'executor'

    public ActorThreadPool(int threads) {
        this.threads = Executors.newFixedThreadPool(threads);
        acts = new ConcurrentHashMap<T, Queue<Runnable>>();
        playingNow = ConcurrentHashMap.newKeySet();
    }

    public void submit(T act, Runnable r) {
        synchronized (act) {
            if (!playingNow.contains(act)) {
                playingNow.add(act);
                execute(r, act);
            } else {
                pendingRunnablesOf(act).add(r);
            }
        }
    }

    public void shutdown() {
        threads.shutdownNow();
    }

    private Queue<Runnable> pendingRunnablesOf(T act) {
        Queue<Runnable> pendingRunnables = acts.get(act);
        if (pendingRunnables == null)
            acts.put(act, pendingRunnables = new LinkedList<>());
        return pendingRunnables;
    }

    private void execute(Runnable r, T act) {
        threads.submit(() -> {
            try {
                r.run();
            } finally {
                complete(act);
            }
        });
    }

    private void complete(T act) {
        synchronized (act) {
            Queue<Runnable> pending = pendingRunnablesOf(act);
            if (pending.isEmpty()) {
                playingNow.remove(act);
            } else {
                execute(pending.poll(), act);
            }
        }
    }
}

```

**A technical problem.** The address of each connection handler is kept in the `attachment` field of its `SelectionKey` in the `Selector` (in the field of the "attached object"). Until now, when a client disconnected, the `Selector`, in its internal implementation, removed its `SelectionKey` from the `Selector` automatically, so there were no more references to the connection handler, and the garbage collector would clean up its memory. But now there is still a reference to it, in the `acts` table of the `ActorThreadPool`.

- **So that you do not have to manage removing a connection handler** as if it were no longer relevant, use Java's `WeakHashMap`, which automatically removes entries whose key has only one reference.
- **Since `WeakHashMap` is not thread-safe,** perform the access to it under synchronization, with a `ReaderWriterLock`.

```java
public class ActorThreadPool<T> {

    private final Map<T, Queue<Runnable>> acts;
    private final Set<T> playingNow;
    private final ExecutorService threads;   // the 'executor'
    private final ReadWriteLock actsRWLock;

    public ActorThreadPool(int threads) {
        this.threads = Executors.newFixedThreadPool(threads);
        acts = new WeakHashMap<T, Queue<Runnable>>();
        playingNow = ConcurrentHashMap.newKeySet();
        actsRWLock = new ReentrantReadWriteLock();
    }

    public void submit(T act, Runnable r) {
        synchronized (act) {
            if (!playingNow.contains(act)) {
                playingNow.add(act);
                execute(r, act);
            } else {
                pendingRunnablesOf(act).add(r);
            }
        }
    }

    public void shutdown() {
        threads.shutdownNow();
    }

    private Queue<Runnable> pendingRunnablesOf(T act) {
        actsRWLock.readLock().lock();
        Queue<Runnable> pendingRunnables = acts.get(act);
        actsRWLock.readLock().unlock();

        if (pendingRunnables == null) {
            actsRWLock.writeLock().lock();
            acts.put(act, pendingRunnables = new LinkedList<>());
            actsRWLock.writeLock().unlock();
        }
        return pendingRunnables;
    }

    private void execute(Runnable task, T act) {
        threads.submit(() -> {
            try {
                task.run();
            } finally {
                complete(act);
            }
        });
    }

    private void complete(T act) {
        synchronized (act) {
            Queue<Runnable> pending = pendingRunnablesOf(act);
            if (pending.isEmpty()) {
                playingNow.remove(act);
            } else {
                execute(pending.poll(), act);
            }
        }
    }
}

```

Now all that is left is to change the type of the `pool` in the `Reactor` class from `ExecutorService` to `ActorThreadPool`, and to add the connection handler in the call to `submit`:

```java
class Reactor {
    ...
    ActorThreadPool<NonBlockingConnectionHandler> pool;
    ...

    private void handleReadWrite(SelectionKey key) {
        NonBlockingConnectionHandler handler = (NonBlockingConnectionHandler) key.attachment();
        if (key.isReadable()) {
            Runnable task = handler.continueRead();
            if (task != null) {
                pool.submit(handler, task);
            }
        } else {
            handler.continueWrite();
        }
    }
}

```

**A note:** in the given implementation of `ActorThreadPool`, `synchronized` is used to synchronize the methods `submit` and `complete`. You can avoid using `synchronized` (since, as we saw, it is not efficient in practice) and synchronize with `CAS`, but that requires a somewhat complex design. It is not done within the course (**it is not exam material**), but it is worth looking at the implementation as reading material.

```java
public class NonBlockingActorThreadPool<T> {

    private ExecutorService pool;
    private final ReadWriteLock actsRWLock = new ReentrantReadWriteLock();
    private Map<T, Actor> acts = new WeakHashMap<>();

    public NonBlockingActorThreadPool(int threads) {
        this.pool = Executors.newFixedThreadPool(threads);
    }

    private Actor getActor(T act) {
        actsRWLock.readLock().lock();
        Actor actor = acts.get(act);
        actsRWLock.readLock().unlock();

        if (actor == null) {
            actsRWLock.writeLock().lock();
            acts.put(act, actor = new Actor());
            actsRWLock.writeLock().unlock();
        }
        return actor;
    }

    public void submit(T act, Runnable r) {
        getActor(act).add(r);
    }

    public void shutdown() {
        pool.shutdownNow();
    }

    private static class ExecutionState {
        // the amount of tasks that should be handled
        public int tasksLeft;
        // true if there is a thread that handles or is designated to handle these tasks
        public boolean playingNow;

        public ExecutionState(int tasksLeft, boolean playingNow) {
            this.tasksLeft = tasksLeft;
            this.playingNow = playingNow;
        }
    }

    private class Actor implements Runnable {

        public ConcurrentLinkedQueue<Runnable> tasksQueue = new ConcurrentLinkedQueue<>();
        public AtomicReference<ExecutionState> state =
            new AtomicReference<>(new ExecutionState(0, false));

        public void add(Runnable task) {
            tasksQueue.add(task);
            ExecutionState oldState = state.get();
            // after this operation completes, one additional task will be added to the queue,
            // and a thread for this task will be executed if not already is
            ExecutionState newState = new ExecutionState(oldState.tasksLeft + 1, true);

            while (!state.compareAndSet(oldState, newState)) {
                oldState = state.get();
                newState.tasksLeft = oldState.tasksLeft + 1;
            }

            if (!oldState.playingNow) {
                pool.submit(this);
            }
        }

        @Override
        public void run() {
            // when this function completes, 0 tasks will be in the queue
            // and no one will and the actor will not "play now"
            ExecutionState newState = new ExecutionState(0, false);
            int tasksDone = 0;
            ExecutionState oldState;

            do {
                oldState = state.get();
                for (; tasksDone < oldState.tasksLeft; tasksDone++) {
                    tasksQueue.remove().run();
                }
            } while (!state.compareAndSet(oldState, newState));
        }
    }
}

```

### Registration changes from other threads (an exam case)

Note that trying to change the registration of events for a channel in the `Selector` may move the thread doing it to the Blocked state, if another thread is performing `select` right now.

In particular, in our system, if a worker thread, after adding a reply to a client in its `writeQueue`, changes the client's registration in the `Selector` from `READ` to `READ | WRITE`, it may get stuck, if the communication thread is performing `select`.

- **So limit the updating of registrations in the `Selector` to the communication thread only** (just as you kept the worker thread away from I/O).

**The mechanism:**

- **define a queue of "registration update" tasks** for the communication thread,
- **in the method `updateInterestOps`,** if the current thread is not the communication thread (define a variable that identifies the communication thread), do not actually change the registration, but add a "registration update" task to the list,
- **add to the communication thread's loop** the running of the registration-update tasks.

```java
public class Reactor {
    private final ConcurrentLinkedQueue<Runnable> selectorTasks = new ConcurrentLinkedQueue<>();
    private Thread selectorThread;
    ...

    public void serve() {
        selectorThread = Thread.currentThread();
        ...
        // Main loop
        while (!Thread.currentThread().isInterrupted()) {
            selector.select();
            runSelectionThreadTasks();
            for (SelectionKey key : selector.selectedKeys()) {
                ... // handleAccept / ReadWrite
            }
            selector.selectedKeys().clear();
        }
        pool.shutdown();
    }
    ...

    void updateInterestedOps(SocketChannel chan, int ops) {
        SelectionKey key = chan.keyFor(selector);
        if (Thread.currentThread() == selectorThread)
            key.interestOps(ops);
        else {
            selectorTasks.add(() -> {
                if (key.isValid())
                    key.interestOps(ops);
            });
            selector.wakeup();
        }
    }

    private void runSelectionThreadTasks() {
        while (!selectorTasks.isEmpty())
            selectorTasks.remove().run();
    }
}

```

**Back to the question of synchronizing the registration update in `continueWrite`:** thanks to this mechanism, updating the registration by a worker thread to `READ | WRITE` is defined as a task for the communication thread, plus `wakeup`. That is the "notify". So in any case, if the communication thread had updated the registration to `READ`, it is immediately woken in the next `select`, and runs the worker thread's update task. In the end, the registration is in any case `READ | WRITE`.

### Reusing a ByteBuffer

In the current code, a new `ByteBuffer` is created before every read. You can make this more efficient, and reuse existing `ByteBuffer`s (not part of the principle):

```java
public class NonBlockingConnectionHandler {
    private static final ConcurrentLinkedQueue<ByteBuffer> BUFFER_POOL =
        new ConcurrentLinkedQueue<ByteBuffer>();
    ...

    public Runnable continueRead() {
        ByteBuffer buf = leaseBuffer();
        ...
        releaseBuffer(buf);
    }

    private static ByteBuffer leaseBuffer() {
        ByteBuffer buff = BUFFER_POOL.poll();
        if (buff == null) {
            return ByteBuffer.allocateDirect(BUFFER_ALLOCATION_SIZE);
        }
        buff.clear();
        return buff;
    }

    private static void releaseBuffer(ByteBuffer buff) {
        BUFFER_POOL.add(buff);
    }
}

```

The full code of the reactor is in the course's class material.

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

:::problem id=ps10-stomp title="STOMP frames" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
A client wants to receive messages for `/topic/a`.

:::check id=ps10-stomp-q1
What does the client send first, and what does it send after it has read the reply?

- [ ] `SUBSCRIBE`, then `CONNECT`
- [ ] `MESSAGE`, then `SUBSCRIBE`
- [x] `CONNECT` with `accept-version` and `host`, then `SUBSCRIBE` with `id` and `destination`

- **First:** the client sends `CONNECT` with the headers `accept-version` and `host`, and waits for the server's `CONNECTED` frame.
- **The reply:** `CONNECTED` carries a `version` header, which names the protocol version the session will use.
- **Then:** the client sends `SUBSCRIBE` with an `id`, such as `sub-1`, and `destination:/topic/a`.
:::

:::check id=ps10-stomp-q2
Which of these hold after that `SUBSCRIBE`?

- [x] If the server cannot create the subscription, it sends `ERROR` with a `message` header
- [ ] The headers are rejected unless `id` comes before `destination`
- [x] A subscription that succeeded later delivers `MESSAGE` frames whose `destination` is `/topic/a`

- **On failure:** if the server cannot create the subscription, it sends an `ERROR` frame with a `message` header that explains why.
- **On success:** every later message sent to `/topic/a` reaches the client as a `MESSAGE` frame whose `destination` is `/topic/a`.
- **Header order:** STOMP headers may appear in any order.
:::

:::check id=ps10-stomp-q3
Every frame ends with {{=a null character|a newline|a length prefix}}.

Every STOMP frame ends with the null character `'\0'`, which is how the receiver knows the frame is complete.
:::

:::check id=ps10-stomp-q4
How does the client leave before closing the socket when it wants a receipt?

- [x] It sends `DISCONNECT` with a `receipt` header, and the server answers `RECEIPT`
- [ ] It sends `UNSUBSCRIBE` and waits for another `CONNECTED`
- [ ] It closes the socket, and the server answers `ERROR`

To leave politely, the client sends `DISCONNECT` with a `receipt` header. The server answers with a `RECEIPT` frame, which confirms it has processed everything the client sent, and only then does the client close the socket.
:::
:::

:::examnote
- **What the question looks like:** it asks you to replace a delimiter with a length prefix, to cap the number of clients, or to design a small command protocol on top of the existing server.
- **The usual traps:** treating one TCP read as one whole message, or forgetting that UDP has no `accept`.
:::

:::problem id=exam-15b-q3 title="A spell-check server" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The message server in the exam's appendix is a thread-per-client server, which starts one thread for each accepted socket. The question changes it as follows.

- **At most 10 handlers** may run at the same time.
- **`MessageLengthBasedTokenizer`** frames each message as a length followed by exactly that many bytes, replacing the delimiter used in class.
- **`SpellMessageEncoder`** turns a `SpellMessage` into bytes and back.
- **The spell-check server** uses `SpellMessage`, that framing, and a thread-safe `LexiconBasedSpellChecker` with an empty constructor.

:::check id=exam-15b-q3-q1
Which body caps the running handlers at 10?

- [ ] `new Thread(connectionHandler).start()` for every accepted socket
- [ ] `Executors.newFixedThreadPool(10)` created inside each handler, after `accept` has returned
- [x] `ExecutorService executor = Executors.newFixedThreadPool(10);` and `executor.execute(connectionHandler)` for each accepted socket

- **The official solution** creates one pool of 10 threads and calls `executor.execute(connectionHandler)` for each accepted socket.
- **The accept loop** stays on the main thread, so the server keeps accepting connections.
- **The cap:** the pool has only 10 threads, so at most 10 handlers run at once.
- **Extra connections:** an 11th handler waits in the pool's queue until a thread is free.
- **Why the second option is wrong:** a new pool per handler gives no shared limit at all.
:::

:::check id=exam-15b-q3-q2
`nextMessage` returns only after the tokenizer has the integer length and then {{=that many payload bytes|a delimiter|one line}}.

- **How the tokenizer works:** it collects bytes until it has read the integer length, then keeps collecting until it has exactly that many payload bytes.
- **When `nextMessage` returns:** only after the whole payload has arrived.
- **No delimiter:** with a length prefix, the tokenizer never searches for a delimiter.
:::

:::check id=exam-15b-q3-q3
Which of these hold for the encoder and the handler?

- [x] The encoder writes the request type, the language, and the word, in an agreed order, with the length prefix the tokenizer expects
- [x] `fromBytes` rebuilds a `SpellMessage`
- [ ] The handler examines a delimiter and skips `SpellMessageEncoder`

The handler is built with `new SpellMessageEncoder()`, `new MessageLengthBasedTokenizer()`, and a protocol object. The protocol reads `SpellMessage.getRequest()` and calls either `LexiconBasedSpellChecker.check` or `getCorrections`. The handler never looks for a delimiter.
:::

:::check id=exam-15b-q3-q4
Which of these hold for `SpellChecker` and the client?

- [ ] Each handler builds a private checker, because the implementation is not safe to share
- [x] `SpellChecker` stays the interface, and the handlers share one instance because the implementation is already thread-safe
- [x] The client opens a `Socket` to the host and port, sends one encoded `SpellMessage`, and reads one framed reply

- **`SpellChecker`** stays the interface that the handlers program against.
- **One shared instance is fine:** the implementation is already thread-safe, so all handlers can share a single checker.
- **The client** opens a `Socket` to the server's host and port, sends one encoded `SpellMessage`, and reads one framed reply.
:::
:::

:::problem id=exam-16a-q3 title="A printer protocol" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A printer service was originally an RMI interface with one method, `Printer.print(String)`. The question changes it as follows.

- **A protocol server** replaces the stub and skeleton that RMI generated.
- **At most ten handler threads** may run at once.
- **Messages are framed with a length prefix** that fits in a Java `int`, instead of the delimiter used before.
- **The same service also runs over UDP.**
- **A `Math` interface** gets a hand-written stub and skeleton in the same style.

:::check id=exam-16a-q3-q1
Which body caps the printer handlers at ten?

- [x] `Executors.newFixedThreadPool(10)` around the connection handler
- [ ] `new Thread(connectionHandler).start()` for every accepted socket, with no pool
- [ ] `Executors.newFixedThreadPool(Integer.MAX_VALUE)` around the connection handler

A fixed pool of 10 threads runs the connection handlers, exactly as in the official solution for the message server. A pool of `Integer.MAX_VALUE` threads would set no real limit.
:::

:::check id=exam-16a-q3-q2
The length occupies the first {{=four bytes|delimiter|datagram}}. The bytes after that prefix are the body.

- **The frame:** a Java `int` takes four bytes, so the first four bytes hold the length, and the bytes after them are the body.
- **The limit:** `Integer.MAX_VALUE` is only the largest value the type can hold. The server should still refuse a length larger than the buffer it is willing to allocate.
:::

:::check id=exam-16a-q3-q3
Which of these hold when the printer speaks UDP?

- [ ] `receive` runs only after `accept` returns a connected socket
- [x] `ServerSocket` and `Socket` are replaced by `DatagramSocket`, and there is no `accept`
- [x] One datagram must hold the entire frame, because the stream tokenizer was kept

- **The sockets:** `DatagramSocket` replaces both `ServerSocket` and `Socket`.
- **No connection:** UDP has no connection, so there is no `accept`.
- **Replying:** `receive` fills a `DatagramPacket` that also records the sender's address, and the server sends its reply to that `SocketAddress`.
- **The length prefix:** in UDP it is usually unnecessary, because one datagram is one message. Here it stays, because the student kept the stream tokenizer.
- **The consequence:** each datagram must then hold one entire frame, length prefix included.
:::

:::check id=exam-16a-q3-q4
Which of these hold for the stub and the skeleton?

- [x] `Math_Stub` implements `Math`, writes a command such as `add 2 3`, and reads the reply line
- [ ] `Math_Skel` implements `Math` on the client and turns a decimal result into the command string
- [x] `Math_Skel` parses the command, calls the real `Math`, and returns the decimal result
- [x] An exception on the server becomes an error line, which the stub turns into a `RemoteException`

- **The stub (`Math_Stub`) runs on the client.** It implements `Math`, so the client calls it like a normal object. Each method sends a command such as `add 2 3` through the socket and reads the reply line.
- **The skeleton (`Math_Skel`) runs on the server.** It parses the command, calls the real `Math` implementation, and sends back the decimal result.
- **Errors:** an exception on the server is sent back as an error line, and the stub turns it into a `RemoteException` for the client.
:::
:::

:::problem id=exam-17b-q3 title="Bank commands" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A bank server uses the command-invocation protocol from class. It accepts three commands.

- **`LOGIN name`:** the server remembers which client this connection belongs to, and answers `ack`.
- **`DEPOSIT money`:** the server adds the amount to this client's balance, and answers `ack`.
- **`BALANCE`:** the server answers with this client's current balance.

:::check id=exam-17b-q3-q1
Which of these hold for `execute`?

- [x] Login stores the connection's name in the protocol's session and returns `"ack"`
- [ ] Deposit before login returns `"ack"` and creates the account
- [x] Deposit parses the amount, adds it to that session's account, and returns `"ack"`

- **The command classes:** `LoginCommand`, `DepositCommand`, and `BalanceCommand` each implement `Command<Bank>`.
- **`LoginCommand.execute`** stores the client's name in this connection's session and returns `"ack"`.
- **`DepositCommand.execute`** parses the amount, adds it to the logged-in client's account, and returns `"ack"`.
- **A deposit before login** has no account to use, so it must not succeed silently.
:::

:::check id=exam-17b-q3-q2
A deposit before login returns {{=an error string|"ack"|the balance}}.

Before `LOGIN`, the session has no name, so the deposit cannot know whose account to change. It returns an error string instead of `"ack"`.
:::

:::check id=exam-17b-q3-q3
Which of these hold for the bank and the session?

- [ ] Each connection builds its own `Bank`
- [x] `Bank` is a map from name to balance, and its mutators are synchronized
- [x] Each connection gets its own protocol object, so the session name is not shared between clients

- **One shared `Bank`:** it is a map from each name to a balance, shared by all connections, and its methods that change balances are `synchronized`.
- **Why the lock matters:** without it, two simultaneous deposits to the same account could overwrite each other, and one amount would be lost.
- **One protocol object per connection:** each client's session, including its login name, is kept separately, so clients never see each other's sessions.
:::

:::check id=exam-17b-q3-q4
Which `main` is correct?

- [ ] It builds a new `Bank` inside every connection
- [x] It builds one `Bank`, a protocol factory that closes over that bank, and the thread-per-client server from the appendix
- [ ] It builds the protocol factory and constructs the `Bank` on the first `LOGIN`

The server's `main` creates one `Bank`, then a protocol factory that gives every new protocol object a reference to that same bank, and finally starts the thread-per-client server from the appendix on the port the question names. Creating a `Bank` per connection would give every client a separate, empty bank.
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

To sum up, a general server is a protocol (an encoder-decoder and a messaging protocol) plus a concurrency model. The reactor gives one communication thread all the non-blocking I/O, gives the worker threads only the processing of messages, and uses the actor thread pool so that two tasks of the same client never run at once.

- **Next:** [The command-invocation server](topic:serialization) uses the same reactor with a protocol whose messages are Java objects.
