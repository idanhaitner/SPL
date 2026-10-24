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

This chapter shows how two processes exchange data, whether they run on the same machine or on opposite sides of a network.

- **Layers:** the network is built in four layers (application, transport, network, and link), and each one has its own job.
- **Sockets:** a socket is how a client and a server open a conversation in this course's Java code.
- **Bytes on the wire:** TCP and UDP carry the bytes, and the application must agree on how those bytes form messages.

## The layer model

Networking in this course uses a client-server model: the server runs all the time and waits, and a client starts a conversation by connecting to it through a socket.

- **TCP and UDP** are the transport protocols. They carry the bytes from one process to the other.
- **The application** running on top of them must agree on a message format, because the transport does not tell it where one message ends and the next begins.

| Layer | Role | Unit of data |
| --- | --- | --- |
| **Application** | The application-level protocol (HTTP, STOMP, FTP) | Message |
| **Transport** | End-to-end communication between processes (TCP, UDP) | Segment / datagram (דטגרם) |
| **Network** | Routing packets across the network (IP) | Packet |
| **Link** | Carrying bits over the physical medium | Frame |

![Four layers, application on top, then transport, network, and link](../../web/public/figures/network-layers.svg)

:::definition id=def-host-port title="IP address and port" source="materials/lectures/Chapter 10 - Networking.pptx"

- **IP address:** the address that identifies a machine (a host) on the network.
- **Port:** a number that identifies one process or service on that host. Ports 1–1023 are reserved for well-known system services, such as HTTP on port 80.
- **Together:** an IP address and a port identify exactly one endpoint of a conversation.
:::

### TCP and UDP

| Property | TCP | UDP |
| --- | --- | --- |
| **Connection** | Connection-oriented (handshake) | Connectionless |
| **Reliability** | Reliable (acknowledgment and retransmission) | Best-effort |
| **Order of arrival** | Guaranteed | Not guaranteed |
| **What is carried** | A continuous byte stream | Individual datagrams |

TCP and UDP differ in how the bytes reach the application.

- **TCP gives a reliable stream of bytes over a connection.** A single read returns whatever bytes have arrived so far, which may be half a message or two messages at once.
- **So a TCP application must frame its messages.** It marks where each message ends, either with a delimiter (such as a newline) or with a length prefix, using an encoding both sides agree on.
- **UDP has no connection.** There is no `accept`; the server simply receives datagrams from anyone.
- **A UDP datagram arrives whole or not at all.** It may be lost or arrive out of order, but it is never split or merged with another datagram.

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
- **What happens to client 2:** the operating system completes its connection and puts it in the listen backlog, a queue of connections waiting for `accept`.
- **Why nobody serves it:** the server's only thread is stuck in `read` for client 1, so no thread calls `accept`, and client 2 just waits.

```java
while (true) {
    Socket client = ss.accept();
    handle(client);    // returns only when this client is done
}
```

- **With an accept loop:** the server handles one client until it is finished, then calls `accept` again. Client 2 is served, but only after client 1's conversation ends.
- **The name of this pattern:** a single-threaded, or iterative, server.
- **Serving both at once:** that needs a separate thread for each client, or the non-blocking loop from the Reactor chapter.
:::
:::

:::check id=chk-tcp-udp
Which protocol preserves order and retransmits a lost segment?

- [ ] UDP
- [x] TCP
- [ ] IP

- **TCP** is the reliable protocol: it numbers the bytes, retransmits whatever is lost, and delivers everything in order.
- **UDP** keeps each datagram whole, but it does not retransmit and does not guarantee order.
- **IP** only routes packets between machines, and guarantees neither delivery nor order.
:::

## Practice

:::problem id=ps9-tcp-udp title="TCP or UDP" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
A spell-check client sends one word, and the server sends back one reply.

:::check id=ps9-tcp-udp-q1
Why does UDP fit that exchange?

- [x] UDP needs no handshake and keeps no connection state, so the request and the reply are two datagrams
- [ ] UDP retransmits a lost reply and reports a failed connection
- [ ] UDP frames the reply so the application can see where it ends

UDP needs no handshake and keeps no connection state, so the whole exchange is just two datagrams: one request and one reply. That makes it a good fit for a tiny query.
:::

:::check id=ps9-tcp-udp-q2
Which of these hold for that UDP choice?

- [x] Either datagram can disappear
- [ ] The client can already tell a lost reply from a slow server
- [x] The client cannot tell a lost reply from a slow server unless it adds its own timeout and its own retry

The price of UDP is that either datagram can be lost. The client cannot tell a lost reply from a slow server unless it adds its own timeout and retries the request itself.
:::

:::check id=ps9-tcp-udp-q3
TCP still makes the application decide where the reply {{=ends|begins|retries}}.

- **What TCP adds:** it opens a connection, retransmits lost segments, and delivers the bytes in order. Either the reply arrives, or the client sees the connection fail.
- **What TCP still leaves to you:** it delivers a stream of bytes, so the application must still frame the reply to know where it ends.
- **What TCP costs:** a handshake before any data, and the work of framing.
- **When to choose which:** TCP is the safe default. UDP fits when losing an occasional message is acceptable, such as a measurement that can skip a sample.
:::
:::

:::problem id=ps9-encoding title="Encoding at the two ends" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
In UTF-8, the Hebrew letter א is encoded as the two bytes `D7 90`.

- **The server** writes those two bytes to the socket.
- **The client** reads them through an `InputStreamReader` created without a charset, so it uses the platform's default charset, which here is not UTF-8.

:::check id=ps9-encoding-q1
What fails on the client?

- [ ] The socket drops `D7 90` before any reader sees it
- [x] The client decodes `D7 90` under the wrong charset, so the character is not the letter the server sent
- [ ] `BufferedReader` splits those two bytes into two lines before a charset is applied

The bytes arrive intact, but the client decodes `D7 90` with the wrong charset, so it shows different characters from the letter the server sent.
:::

:::check id=ps9-encoding-q2
Which construction is correct?

- [ ] `new BufferedReader(clientSocket.getInputStream())` and a `PrintWriter` with no charset
- [ ] `new InputStreamReader(clientSocket.getInputStream())` together with an `OutputStreamWriter` that names `"UTF-8"`
- [x] `new InputStreamReader(..., "UTF-8")` inside the `BufferedReader`, and `new OutputStreamWriter(..., "UTF-8")` inside the `PrintWriter`

- **The rule:** both directions must name UTF-8 explicitly, so neither side depends on the platform default.
- **The reader:** `new InputStreamReader(clientSocket.getInputStream(), "UTF-8")`, wrapped in a `BufferedReader`.
- **The writer:** `new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8")`, wrapped in a `PrintWriter`.
:::

:::check id=ps9-encoding-q3
Which of these hold for that pair?

- [x] Both directions name UTF-8
- [x] `BufferedReader` splits lines after the charset is applied
- [ ] `PrintWriter` is the class that applies the charset on the way out

`InputStreamReader` turns bytes into characters using the charset, and `BufferedReader` then splits those characters into lines. On the way out, `OutputStreamWriter` applies the charset, not `PrintWriter`.
:::

:::check id=ps9-encoding-q4
The class that applies the charset to the socket input is {{=InputStreamReader|BufferedReader|PrintWriter}}.

- **`InputStreamReader`** converts incoming bytes to characters, so it is the class that applies the charset on the way in.
- **`OutputStreamWriter`** converts characters to bytes on the way out.
- **`BufferedReader`** only buffers the characters and splits them into lines.
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


A simple server gets stuck whenever a thread blocks on a socket read.

- **Next:** the [Reactor](topic:reactor) shows how one server can wait on many sockets at once, without a thread for each one.
