---
id: networking
title: Networking
sources:
  - "Classes/Chapter 10 - Networking.pptx"
  - "Exrecises/PS9 2026.pptx"
  - "Exrecises/SPL_PS10.pptx"
  - "Exams/15-b.pdf"
  - "Exams/15-b-solution.pdf"
  - "Exams/16-a.pdf"
  - "Exams/16-a-solution.pdf"
  - "Exams/17-b.pdf"
  - "Exams/17-b-solution.pdf"
  - "Exams/20-b.pdf"
  - "Exams/20-b-solution.pdf"
---

A process cannot read another process's memory. Chapter 10 starts from that isolation, including the case of two machines, and builds the channel the rest of the course will program against: a port, a socket, and a choice between TCP and UDP.

## Layers

The lecture uses a shortened OSI stack of four layers. Each layer offers a service to the one above it, hides its own implementation, and speaks a defined protocol.

| layer | job | unit |
| --- | --- | --- |
| link | bits on a wire, timing, the NIC and its driver | frame |
| internet | addresses and routing | packet |
| transport | process to process | segment or datagram |
| application | what the message means | message |

![The four layers the lecture keeps: application on top, then transport, internet, and the link](../assets/figures/network-layers.svg)

The link layer does not know who the application is. The internet layer, IP, puts a source and a destination on each packet. The header carries lengths, an identification, flags, and a TTL (time to live) that routers decrement so a packet cannot loop forever. A router looks up the next hop in a local table and hands the packet to the link layer. IP does not promise that the packet arrives, or that it arrives in order. DNS turns a name into an IP address. NAT lets a private network share one public address.

The course then ignores the bottom and programs the top two layers.

:::definition id=def-host-port title="Host, IP address, port" source="Classes/Chapter 10 - Networking.pptx"
A host (מארח) is a machine on the network that runs processes and sends and receives traffic. An IP address identifies the host for routing, not the process. A port is the number that identifies the process, or the service, on that host. The lecture's analogy is an apartment number in a building. Ports 1 through 1023 are reserved, which session 9 adds.
:::

IPv4 addresses are 32 bits, written `132.72.43.254`. IPv6 addresses are 128 bits. `0.0.0.0` is reserved. `127.0.0.1` and `::1` are loopback: a TCP or UDP conversation that never leaves the machine and skips the physical link.

Four axes describe a channel, in the lecture's table:

- Connectionless, or connection-oriented. UDP has no session and no handshake. TCP requires a handshake and then has a session.
- Unbuffered, or buffered. Send immediately, or gather bytes and send a chunk.
- Synchronous or asynchronous, which the slide also lines up with blocking and non-blocking. A blocking call waits. A non-blocking call returns so the thread can ask for status later.
- Reliable or unreliable. TCP acknowledges and retransmits, keeps order, and does not flood the receiver. UDP is best effort: a datagram can disappear or arrive out of order, and what arrives is the whole datagram or nothing.

### TCP and UDP in Java

```java
// TCP server
ServerSocket ss = new ServerSocket(80);
Socket s = ss.accept();
Scanner in = new Scanner(s.getInputStream());
PrintWriter out = new PrintWriter(s.getOutputStream(), true);

// UDP server
DatagramSocket ds = new DatagramSocket(5000);
byte[] buf = new byte[256];
DatagramPacket p = new DatagramPacket(buf, buf.length);
ds.receive(p);

// UDP client
DatagramSocket ds = new DatagramSocket();
byte[] msg = "hi from udp client".getBytes();
InetAddress ip = InetAddress.getByName("127.0.0.1");
DatagramPacket p = new DatagramPacket(msg, msg.length, ip, 5000);
ds.send(p);
```

`accept` blocks until a client connects, and each accepted `Socket` is a different connection. Many clients can share the server's port. The stack demultiplexes by the client's address and port as well as the server's. Session 9's echo server is this loop: read a line, write it back, with `InputStreamReader` and `OutputStreamWriter` locked to UTF-8. Bytes are not characters. The session's table shows a Hebrew letter as the two UTF-8 bytes `d7 90`. If the two ends disagree on the charset, the characters come out wrong. Only the code points 0 through 127 are safe across the encodings the session mentions.

A protocol, in the session's words, is the rules of the conversation: how a message is framed, addressed, and interpreted. The echo protocol is "a line in, the same line out." HTTP, on port 80, is a later example the session writes by hand onto a `Socket`.

### Other channels, briefly

The lecture spends the second half of the deck on mechanisms that are not all network protocols. The comparison table at the end is the one to remember.

| mechanism | direction | crosses machines | reliable |
| --- | --- | --- | --- |
| anonymous pipe | one way | no | yes |
| named pipe | one way, sits on a file name | no | yes |
| TCP socket | both ways | yes | yes |
| UDP socket | datagrams | yes | no |
| message queue | messages | no, unless a product extends it | yes |
| memory-mapped file and shared memory | both sides see bytes | no | the memory is just memory |
| signals, mutex, semaphore, condition variable, file lock | synchronization, not a byte stream | no | not a delivery service |

An anonymous pipe dies with the process. A named pipe does not disappear when you close the descriptor. Shared memory is the fastest and the easiest to get wrong, which is why the concurrency chapter exists. The course's servers use TCP sockets.

C++ threads show up in session 10 because assignment 3's client is in C++. `std::thread` runs a function. You must `join` or `detach` before the `std::thread` object is destroyed. `std::mutex` is the mutex. `std::lock_guard` locks in its constructor and unlocks in its destructor, the RAII version of `synchronized`. There is no `Runnable`; you pass a function pointer or a lambda.

STOMP, also session 10, is the application protocol on top of a reliable stream. A frame is a command, headers `name:value`, a blank line, a body, and a null character `'\0'`. Header order does not matter. `CONNECT` carries `accept-version` and `host`, and optionally `login` and `passcode`. The server answers `CONNECTED`. `SUBSCRIBE` needs `id` and `destination`. `SEND` needs `destination`. `DISCONNECT` may carry `receipt`, and the server then answers `RECEIPT`. `ERROR` carries a `message` header. The assignment text wins over the slides when they disagree; the session says so on the slide.

:::problem id=worked-tcp-accept source="Classes/Chapter 10 - Networking.pptx" kind=worked solution_origin=source
A TCP server has called `accept` once and is blocked inside `read` on that socket. A second client connects. What happens, and what changes if the server loops back to `accept`?

:::solution
The second connection sits in the listen backlog until somebody calls `accept`. The thread blocked in `read` is not in `accept`, so the second client is not served. A loop that `accept`s, handles one client to completion, then `accept`s again serves the second client only after the first conversation ends. That is the single-threaded server. Serving both at once needs another thread, or the non-blocking loop in the reactor chapter.
:::
:::

:::check id=chk-tcp-udp
Which protocol on the lecture's table keeps order and retransmits a lost segment?

- [ ] UDP
- [x] TCP
- [ ] IP

IP does not promise delivery or order. UDP keeps the datagram boundary and still does not promise delivery. TCP is the row marked reliable, ordered, and session-oriented.
:::

:::trap
`read` on a TCP socket returns a count of bytes, not a message. A logical line may arrive in two reads, or two lines may arrive in one. The encoder-decoder, not the socket, finds the message boundary. UDP preserves the boundary and may drop the datagram.
:::

:::trap
Writing characters through an `OutputStream` with the platform default charset, and reading them as UTF-8, is the session's "bad decoding" slide. Construct the reader and the writer with the same charset name.
:::

## Practice

:::problem id=ps9-tcp-udp source="Exrecises/PS9 2026.pptx" kind=exercise solution_origin=source
From session 9's comparison: for a spell-check request of one word and one response, give one reason to choose UDP and one reason to choose TCP.

:::hint
UDP skips the handshake. TCP does not lose the response quietly.
:::
:::hint
A spell-check message fits in one datagram. A file transfer does not want that gamble.
:::
:::hint
Name the handshake and the retransmission, not "UDP is faster" alone.
:::
:::solution
UDP needs no handshake and no connection state, so one request and one reply are two datagrams. That is the reason to choose it for a tiny query. The cost is that either datagram can disappear, and the client cannot tell a lost reply from a slow server unless it adds its own timeout and retry.

TCP establishes a session, retransmits lost segments, and delivers bytes in order. The reply arrives, or the connection fails visibly. The cost is the handshake and the stream framing: you must decide where the response ends. For anything the user will retry by hand, TCP is the session's default. For a measurement that can drop a sample, UDP matches the lecture's "best effort" row.
:::
:::

:::problem id=ps9-encoding source="Exrecises/PS9 2026.pptx" kind=exercise solution_origin=source
The session shows a Hebrew letter whose UTF-8 encoding is the bytes `D7 90`. The server writes those bytes. The client builds an `InputStreamReader` with the platform charset, which is not UTF-8. What does the client fail to do, and what constructor fixes it?

:::hint
The socket carries bytes. Characters are an agreement above that.
:::
:::hint
`InputStreamReader` is the class that applies a charset. `BufferedReader` only splits lines.
:::
:::hint
The session's good client passes `"UTF-8"` to both the reader and the writer.
:::
:::solution
The client decodes `D7 90` under the wrong charset, so the letter is not the letter the server sent. The fix is the pair on the slide:

```java
bufferIn = new BufferedReader(
    new InputStreamReader(clientSocket.getInputStream(), "UTF-8"));
writerOut = new PrintWriter(
    new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8"), true);
```

Both directions name UTF-8. `BufferedReader` then splits lines. It does not choose the charset.
:::
:::

:::problem id=ps10-lock-guard source="Exrecises/SPL_PS10.pptx" kind=exercise solution_origin=source
Translate a Java `synchronized (mutex)` block that prints a task id into the C++ of session 10. Include the thread launch and the wait. State the rule the session gives for destroying a `std::thread`.

:::hint
`std::lock_guard` is constructed with the mutex and destroyed at the end of the scope.
:::
:::hint
`std::thread th(&Task::run, &task)` runs the method. `join` waits.
:::
:::hint
The rule is join or detach, before the destructor.
:::
:::solution
```cpp
std::mutex mutex;
Task task1(1, mutex);
std::thread th1(&Task::run, &task1);
th1.join();
```

Inside `Task::run`, `std::lock_guard<std::mutex> guard(mutex);` locks at construction and unlocks when `guard` leaves the scope, including on a return. That is the session's RAII stand-in for `synchronized`. If `th1`'s destructor runs while the thread is still joinable, the program calls `std::terminate`. Every `std::thread` is joined or detached first.
:::
:::

:::problem id=ps10-stomp source="Exrecises/SPL_PS10.pptx" kind=exercise solution_origin=source
A client wants to receive messages for `/topic/a`. List the STOMP frames it sends, in order, and the frame it receives if the server cannot subscribe it. Say what ends a frame.

:::hint
The session's first client frame is `CONNECT` or `STOMP`, not `SUBSCRIBE`.
:::
:::hint
`SUBSCRIBE` has two mandatory headers, `id` and `destination`.
:::
:::hint
A frame ends with a null byte, after the body.
:::
:::solution
The client sends `CONNECT` with `accept-version` and `host`, and reads `CONNECTED` (the `version` header is the version the session will use). It then sends

```
SUBSCRIBE
id:sub-1
destination:/topic/a

\0
```

If the server cannot create the subscription it sends `ERROR`, with a `message` header, not a `MESSAGE` frame. A successful subscription later delivers `MESSAGE` frames whose `destination` is `/topic/a`. Each frame ends with the null character `'\0'`. Header order does not matter. `DISCONNECT`, optionally with `receipt`, is how the client leaves before closing the socket; the server answers `RECEIPT` when the receipt header was present.
:::
:::


:::examnote
The question replaces a delimiter with a length prefix, caps the number of clients, or asks for a small command protocol on the existing server. The trap is treating a TCP read as a whole message, or forgetting that UDP has no `accept`.
:::

:::problem id=exam-15b-q3 source="Exams/15-b.pdf" kind=exam solution_origin=source
The messaging server from the appendix is a thread per accepted socket.

a. (5) Run at most 10 threads.
b. (5) `MessageLengthBasedTokenizer` frames a message as a length followed by that many bytes, not as a delimiter.
c. (5) `SpellMessageEncoder` turns a `SpellMessage` into bytes and back.
d. (8) A spell server uses `SpellMessage`, the length tokenizer, and a thread-safe `LexiconBasedSpellChecker` with an empty constructor.
e. Update `SpellChecker` so the server in the question compiles.
f. Finish the client `main`.

:::hint
A fixed pool of 10 is the cap. Creating a `Thread` per `accept` with no pool does not cap anything.
:::
:::hint
Read the length first, then read exactly that many bytes. `hasMessage` is false until those bytes are present.
:::
:::hint
The official server submits each connection to `Executors.newFixedThreadPool(10)` instead of `new Thread(...).start()` with no bound.
:::
:::solution
a. The official solution builds `ExecutorService executor = Executors.newFixedThreadPool(10)` and `executor.execute(connectionHandler)` for each accepted socket. The accept loop itself stays on the main thread. At most 10 handlers run. Further connections wait in the pool's queue, or you can refuse them when the queue is what you consider "more than 10."

b. The tokenizer accumulates bytes until it has the integer length and then that many payload bytes. Only then does `nextMessage` return. A delimiter is not consulted.

c. The encoder writes the request kind, the language, and the word in an agreed order, with the length prefix the tokenizer expects, and `fromBytes` rebuilds a `SpellMessage`.

d. The handler is constructed with `new SpellMessageEncoder()`, `new MessageLengthBasedTokenizer()`, and a protocol that calls `LexiconBasedSpellChecker.check` or `getCorrections` according to `SpellMessage.getRequest()`.

e. `SpellChecker` stays the interface on the exam. The implementation is already thread-safe, so handlers may share one instance.

f. The client opens a `Socket` to the host and port, sends one encoded `SpellMessage`, and reads one framed reply.
:::
:::

:::problem id=exam-16a-q3 source="Exams/16-a.pdf" kind=exam solution_origin=derived
A printer service was an RMI interface `Printer.print(String)`. A student replaced the generated stub and skeleton with a protocol server.

a. (6) At most ten handler threads.
b. (6) Frame by a length, not by a delimiter. The length fits in a Java `int`.
c. (6) Speak UDP instead of TCP.
d. (6) Write a stub and a skeleton, in the same style, for `Math` with the methods on the exam.
e. (6) Serve the printer's clients with the reactor instead of a thread per client.

:::hint
The cap is the same pool as 2015. The reactor part is a different server loop, not a bigger pool.
:::
:::hint
UDP has no `accept`. Each datagram carries the sender's address, and the reply uses that address.
:::
:::hint
A stub implements `Math` by sending a method name and arguments. A skeleton reads that message and calls the real object.
:::
:::solution
a. `Executors.newFixedThreadPool(10)` around the connection handler, as in the 2015 solution.

b. The first four bytes are the length. The following bytes are the body. `Integer.MAX_VALUE` is only the type's limit; you still refuse a length that will not fit in the buffer you chose.

c. Replace `ServerSocket` / `Socket` with `DatagramSocket`. There is no connection. `receive` returns the sender. `send` uses that `SocketAddress`. A length prefix is optional on UDP if one datagram is one message; the question still wants the length because the student kept the stream tokenizer. One datagram must then hold the whole frame.

d. `Math_Stub` implements `Math`. Each method writes a command string such as `add 2 3` through the socket and reads the reply line. `Math_Skel` implements the protocol factory, parses the command, calls the real `Math`, and returns the decimal result. Exceptions on the server become an error line the stub turns into `RemoteException`.

e. Register a `ServerSocketChannel` with the reactor from class, with the printer protocol as the protocol factory and the length tokenizer as the tokenizer factory. The selector thread replaces the accept loop. Handlers stop being one thread each.
:::
:::

:::problem id=exam-17b-q3 source="Exams/17-b.pdf" kind=exam solution_origin=derived
A bank server uses the command-invocation protocol from class. Three commands arrive as lines: `LOGIN name` (server replies `ack` and remembers the client), `DEPOSIT money` (add to that client's balance, reply `ack`), and a third command the paper uses to read the balance. Implement the commands and the server `main` that hosts them. Write the commands, then the server main.

:::hint
Each command is an object with `execute` on the bank, not a pile of `if` statements in the socket code.
:::
:::hint
`LOGIN` must happen before `DEPOSIT`, or `DEPOSIT` has no account. That is a precondition.
:::
:::hint
The server main constructs one bank and a reactor or a thread-per-client loop that turns a line into a command.
:::
:::solution
`LoginCommand`, `DepositCommand`, and `BalanceCommand` implement `Command<Bank>`. `execute` on a login stores the connection's name in the protocol's session and returns `"ack"`. `execute` on a deposit parses the amount, adds it to that session's account, and returns `"ack"`. A deposit before login returns an error string rather than throwing into the selector thread.

`Bank` is a map from name to balance, and its mutators are synchronized. The server `main` builds one `Bank`, a protocol factory that closes over it, and the reactor or thread-per-client server from the appendix on the exam's port. Each connection gets its own protocol object, so the session name is not shared across clients. The bank is shared, and the lock is what makes two deposits of the same account add both amounts.
:::
:::

:::problem id=exam-20b-q3 source="Exams/20-b.pdf" kind=exam solution_origin=derived
`Stores` maps a store name to product prices. Commands arrive through the command-invocation protocol and run on one shared `Stores` object inside a reactor on port 7777.

a. Implement `GetProductPrices`, which takes a product name and returns the map of store name to price.
b. Wire `PriceServer.main` so the reactor executes those commands on the one `StoresImpl`.

:::hint
`execute` receives the `Stores` object. It does not open a socket.
:::
:::hint
The reply has to be a string or a byte buffer the protocol already knows how to write. Encode the map as lines.
:::
:::hint
One `StoresImpl` is constructed in `main` and captured by every command. Do not construct a store per connection.
:::
:::solution
```java
class GetProductPrices implements Command<Stores> {
    private final String product;
    public GetProductPrices(String product) { this.product = product; }
    public String execute(Stores stores) {
        StringBuilder out = new StringBuilder();
        for (String store : stores.getStores()) {
            Integer price = stores.getProductsOfStore(store).get(product);
            if (price != null) out.append(store).append('=').append(price).append('\n');
        }
        return out.toString();
    }
}
```

`main` creates `Stores stores = new StoresImpl()` once, then `new Reactor(7777, 10, () -> new CommandProtocol(stores), tokenizerFactory)`. The protocol parses a line into a `Command<Stores>` and calls `execute(stores)`. `StoresImpl`'s methods are synchronized, or the map is a concurrent map, because the reactor runs several commands at once on that one object.
:::
:::

The socket is the blocking call a naive server gets stuck in. [The reactor](topic:reactor) is the way to wait for many sockets without a thread for each.
