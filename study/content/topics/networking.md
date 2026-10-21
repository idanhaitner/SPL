---
id: networking
title: Networking
sources:
  - "materials/lectures/Chapter 10 - Networking.pptx"
  - "materials/sessions/PS9 2026.pptx"
  - "materials/sessions/SPL_PS10.pptx"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
---

Networking is how two processes exchange data, on one machine or across a network. In the client-server arrangement used in this course, the server stays available and the client opens the exchange through a socket. TCP and UDP carry the bytes. The application above them agrees on a message format, because the transport does not hand the application a finished message by itself.

## The layer model

| Layer | Role | Unit of data |
| --- | --- | --- |
| **Application** | The application-level protocol (HTTP, STOMP, FTP) | Message |
| **Transport** | End-to-end communication between processes (TCP, UDP) | Segment / datagram (דטגרם) |
| **Network** | Routing packets across the network (IP) | Packet |
| **Link** | Carrying bits over the physical medium | Frame |

![The four layers the lecture keeps: application on top, then transport, network, and link](../assets/figures/network-layers.svg)

:::definition id=def-host-port title="IP address and port" source="materials/lectures/Chapter 10 - Networking.pptx"

- **IP address:** identifies the host on the network.
- **Port:** a number that identifies a particular process or service on that host. Ports 1–1023 are reserved for system services.
:::

### TCP and UDP

| Property | TCP | UDP |
| --- | --- | --- |
| **Connection** | Connection-oriented (handshake) | Connectionless |
| **Reliability** | Reliable (acknowledgment and retransmission) | Best-effort |
| **Order of arrival** | Guaranteed | Not guaranteed |
| **What is carried** | A continuous byte stream | Individual datagrams |

TCP is a connection-oriented reliable byte stream. A read returns some bytes that have arrived. Those bytes are not required to be one application message, so the application-level protocol frames each message with a delimiter or a length prefix, under an agreed encoding. UDP is connectionless. There is no `accept`. A datagram arrives whole or not at all.

### Sockets in Java

```java
// TCP Server
ServerSocket server = new ServerSocket(8080);
Socket client = server.accept(); // blocking wait
BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream(), "UTF-8"));
PrintWriter out = new PrintWriter(new OutputStreamWriter(client.getOutputStream(), "UTF-8"), true);

// UDP Server
DatagramSocket socket = new DatagramSocket(5000);
byte[] buf = new byte[1024];
DatagramPacket packet = new DatagramPacket(buf, buf.length);
socket.receive(packet); // blocking wait

```

:::problem id=worked-tcp-accept title="One accept" source="materials/lectures/Chapter 10 - Networking.pptx" kind=worked solution_origin=source
A second client connects while this server is blocked inside `read`. What happens, and what changes if the server loops back to `accept`?

```java
ServerSocket ss = new ServerSocket(80);
Socket first = ss.accept();          // client 1
InputStream in = first.getInputStream();
in.read(buf);                         // blocked here
// client 2 connects during the read
```

:::solution
The second connection waits in the listen backlog until some thread calls `accept`. The thread blocked in the read is not inside `accept`, so the second client is not served.

```java
while (true) {
    Socket client = ss.accept();
    handle(client);    // returns only when this client is done
}
```

An accept loop that calls `accept`, handles one client until that client is finished, and then calls `accept` again serves the second client only after the first conversation ends. That is a single-threaded server. Serving both clients at the same time takes another thread, or the non-blocking loop in the Reactor chapter.
:::
:::

:::check id=chk-tcp-udp
Which protocol in the lecture's table preserves order and retransmits a lost segment?

- [ ] UDP
- [x] TCP
- [ ] IP

IP routes packets and guarantees neither delivery nor order. UDP keeps each datagram whole and still gives no delivery guarantee. TCP is the row marked reliable, ordered, and connection-oriented.
:::

## Practice

:::problem id=ps9-tcp-udp title="TCP or UDP" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
For a spell-check of one word and one reply, give one reason to choose UDP and one reason to choose TCP.

:::hint
UDP skips the handshake. TCP does not drop the reply quietly.
:::
:::hint
A spell-check message fits in one datagram. A file transfer does not want that gamble.
:::
:::hint
Name the handshake and the retransmission. "UDP is faster" is not a reason.
:::
:::solution
UDP needs no handshake and keeps no connection state, so one request and one reply are two datagrams. That is the reason to choose it for a tiny query. The cost is that either datagram can disappear, and the client cannot tell a lost reply from a slow server unless the client adds its own timeout and its own retry.

TCP opens a connection, retransmits lost segments, and delivers bytes in order. The reply arrives, or the connection fails in a way the client can observe. The cost is the handshake and the framing of the stream: the application has to decide where the reply ends. When the user will simply try the request again by hand, the practical session treats TCP as the default. When a measurement can omit a sample, UDP matches the lecture's best-effort row.
:::
:::

:::problem id=ps9-encoding title="Encoding at the two ends" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
A Hebrew letter is encoded in UTF-8 as the bytes `D7 90`. The server writes those bytes. The client builds an `InputStreamReader` with the platform charset, which is not UTF-8. What does the client fail to do, and which constructor fixes it?

:::hint
The socket carries bytes. Characters are an agreement above those bytes.
:::
:::hint
`InputStreamReader` is the class that applies a charset. `BufferedReader` only splits lines.
:::
:::hint
The client from the practical session passes `"UTF-8"` to both the reader and the writer.
:::
:::solution
The client decodes `D7 90` under the wrong charset, so the character is not the letter the server sent. The fix is the pair of constructors on the slide:

```java
bufferIn = new BufferedReader(
    new InputStreamReader(clientSocket.getInputStream(), "UTF-8"));
writerOut = new PrintWriter(
    new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8"), true);
```

Both directions name UTF-8. `BufferedReader` then splits lines. `InputStreamReader` and `OutputStreamWriter` are the classes that apply the charset.
:::
:::

:::problem id=ps10-lock-guard title="A lock in C++" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
Translate this block to C++. Include starting the thread and waiting for it, and state the rule for destroying a `std::thread`.

```java
synchronized (mutex) {
    System.out.println(taskId);
}
Thread worker = new Thread(task);
worker.start();
worker.join();
```

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

Inside `Task::run`, `std::lock_guard<std::mutex> guard(mutex);` locks on construction and unlocks when `guard` leaves the scope, including on return. That is the practical session's RAII replacement for `synchronized`. If the destructor of `th1` runs while the thread is still joinable, the program calls `std::terminate`. Every `std::thread` is joined or detached before that destructor runs.
:::
:::

:::problem id=ps10-stomp title="STOMP frames" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
A client wants to receive messages for `/topic/a`. List the STOMP frames it sends, in order, and the frame it receives if the server cannot subscribe it. Say what ends a frame.

:::hint
The client's first frame is `CONNECT` or `STOMP`. `SUBSCRIBE` comes after that frame.
:::
:::hint
`SUBSCRIBE` has two required headers, `id` and `destination`.
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

If the server cannot create the subscription, it sends `ERROR`, with a `message` header. A subscription that succeeded later delivers `MESSAGE` frames whose `destination` is `/topic/a`. Every frame ends with the null character `'\0'`. The order of the headers does not matter. `DISCONNECT`, with a `receipt` header when the client wants one, is how the client leaves before closing the socket. The server answers `RECEIPT` when that receipt header was present.
:::
:::

:::examnote
The question replaces a delimiter with a length prefix, caps the number of clients, or asks for a small command protocol on top of the existing server. The trap is treating a TCP read as one whole message, or forgetting that UDP has no `accept`.
:::

:::problem id=exam-15b-q3 title="A spell-check server" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The message server in the appendix is a thread-per-client server: one thread for each accepted socket.

a. Run at most 10 threads.
b. `MessageLengthBasedTokenizer` frames a message as a length followed by that many bytes. The other design used a delimiter.
c. `SpellMessageEncoder` turns a `SpellMessage` into bytes and back.
d. A spell-check server uses `SpellMessage`, length-prefix framing, and a thread-safe `LexiconBasedSpellChecker` with an empty constructor.
e. Update `SpellChecker` so the server in the question compiles.
f. Finish the client's `main`.

:::hint
A fixed pool of 10 is the ceiling. Creating a `Thread` for every `accept`, with no pool, limits nothing.
:::
:::hint
Read the length first, then read exactly that many bytes. `hasMessage` is false until those bytes are present.
:::
:::hint
The official solution submits each connection to `Executors.newFixedThreadPool(10)`, in place of an unbounded `new Thread(...).start()`.
:::
:::solution
a. The official solution builds `ExecutorService executor = Executors.newFixedThreadPool(10)` and calls `executor.execute(connectionHandler)` for each accepted socket. The accept loop itself stays on the main thread. At most 10 handlers run. Further connections wait in the pool's queue, or the server can refuse them when that queue is what counts as "more than 10".

b. The tokenizer accumulates bytes until it has the integer length and then that many payload bytes. Only then does `nextMessage` return. A delimiter is not examined.

c. The encoder writes the request type, the language, and the word in an agreed order, with the length prefix the tokenizer expects, and `fromBytes` rebuilds a `SpellMessage`.

d. The handler is built with `new SpellMessageEncoder()`, `new MessageLengthBasedTokenizer()`, and a protocol that calls `LexiconBasedSpellChecker.check` or `getCorrections` according to `SpellMessage.getRequest()`.

e. `SpellChecker` stays the interface from the question. The implementation is already thread-safe, so the handlers may share one instance.

f. The client opens a `Socket` to the host and port, sends one encoded `SpellMessage`, and reads one framed reply.
:::
:::

:::problem id=exam-16a-q3 title="A printer protocol" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A printer service was an RMI interface named `Printer.print(String)`. A student replaced the generated stub and skeleton with a protocol server.

a. At most ten handler threads.
b. Length-prefix framing, where the earlier design used a delimiter. The length fits in a Java `int`.
c. Speak UDP where the server used TCP.
d. Write a stub and a skeleton, in the same style, for `Math` with the methods in the question.
e. Serve the printer clients with a Reactor, where the earlier design used one thread per client.

:::hint
The ceiling is the same pool as in the message server. The Reactor part asks for a different server loop. Enlarging the pool leaves that part unanswered.
:::
:::hint
UDP has no `accept`. Each datagram carries the sender's address, and the reply uses that address.
:::
:::hint
A stub implements `Math` by sending a method name and arguments. A skeleton reads that message and calls the real object.
:::
:::solution
a. `Executors.newFixedThreadPool(10)` around the connection handler, as in the official solution of the message server.

b. The first four bytes are the length. The bytes after them are the body. `Integer.MAX_VALUE` is only the limit of the type. The server still refuses a length that will not fit in the buffer you chose.

c. Replace `ServerSocket` and `Socket` with `DatagramSocket`. There is no connection and no `accept`. `receive` returns the sender. `send` uses that `SocketAddress`. A length prefix is optional in UDP when one datagram is one message. This question still wants the length, because the student kept the stream tokenizer. One datagram must then hold the entire frame.

d. `Math_Stub` implements `Math`. Each method writes a command string such as `add 2 3` through the socket and reads the reply line. `Math_Skel` implements the protocol factory, parses the command, calls the real `Math`, and returns the decimal result. An exception on the server becomes an error line, which the stub turns into a `RemoteException`.

e. Register a `ServerSocketChannel` with the Reactor from class, with the printer protocol as the protocol factory and the length tokenizer as the tokenizer factory. The selector thread replaces the accept loop. The handlers are no longer one thread each.
:::
:::

:::problem id=exam-17b-q3 title="Bank commands" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A bank server uses the command-invocation protocol from class. Three commands arrive as lines: `LOGIN name` (the server answers `ack` and remembers the client), `DEPOSIT money` (add the amount to this client's balance and answer `ack`), and a third command that the question uses to read the balance. Implement the commands and the server `main` that hosts them. Write the commands, then the server `main`.

:::hint
Each command is an object with `execute` on the bank. The socket code stays free of a pile of `if` statements.
:::
:::hint
`LOGIN` must happen before `DEPOSIT`, otherwise `DEPOSIT` has no account. That ordering is a precondition.
:::
:::hint
The server `main` builds one bank and a Reactor, or a thread-per-client loop, that turns a line into a command.
:::
:::solution
`LoginCommand`, `DepositCommand`, and `BalanceCommand` implement `Command<Bank>`. `execute` on login stores the connection's name in the protocol's session and returns `"ack"`. `execute` on deposit parses the amount, adds it to that session's account, and returns `"ack"`. A deposit before login returns an error string, so the failure stays off the selector thread.

`Bank` is a map from name to balance, and its mutators are synchronized. The server `main` builds one `Bank`, a protocol factory that closes over it, and the Reactor or thread-per-client server from the appendix, on the port in the question. Each connection gets its own protocol object, so the session name is not shared between clients. The bank is shared, and the lock is what makes two deposits to the same account add both amounts.
:::
:::

:::problem id=exam-20b-q3 title="Store prices" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
`Stores` maps a store name to the prices of its products. Commands arrive through the command-invocation protocol and run on one shared `Stores` object inside a Reactor on port 7777.

a. Implement `GetProductPrices`, which takes a product name and returns the map from store name to price.
b. Wire `PriceServer.main` so the Reactor runs these commands on the single `StoresImpl`.

:::hint
`execute` receives the `Stores` object. Opening a socket is outside this method.
:::
:::hint
The answer has to be a string or a byte buffer that the protocol already knows how to write. Encode the map as lines.
:::
:::hint
One `StoresImpl` is built in `main` and captured by every command. A fresh store for each connection would split the data.
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

`main` creates `Stores stores = new StoresImpl()` once, then `new Reactor(7777, 10, () -> new CommandProtocol(stores), tokenizerFactory)`. The protocol parses a line into a `Command<Stores>` and calls `execute(stores)`. The methods of `StoresImpl` are synchronized, or the map is a concurrent map, because the Reactor runs several commands at once on this one object.
:::
:::

A blocking read on a socket is where a naive server gets stuck. [Reactor](topic:reactor) is how a server waits on many sockets without a thread for each one.
