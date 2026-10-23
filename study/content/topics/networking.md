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

This chapter is how two processes exchange data, on one machine or across a network.

- **Layers** — what application, transport, network, and link each own.
- **Sockets** — how a client and a server open an exchange in this course.
- **Bytes on the wire** — TCP, UDP, and the message format above them.

## The layer model

Networking in this course uses a client-server arrangement: the server stays available and the client opens the exchange through a socket.

- **TCP and UDP:** They carry the bytes.
- **Application layer:** The application above them agrees on a message format, because the transport does not hand the application a finished message by itself.

| Layer | Role | Unit of data |
| --- | --- | --- |
| **Application** | The application-level protocol (HTTP, STOMP, FTP) | Message |
| **Transport** | End-to-end communication between processes (TCP, UDP) | Segment / datagram (דטגרם) |
| **Network** | Routing packets across the network (IP) | Packet |
| **Link** | Carrying bits over the physical medium | Frame |

![Four layers, application on top, then transport, network, and link](../../web/public/figures/network-layers.svg)

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

TCP and UDP differ in how bytes reach the application.

- **TCP:** It is a connection-oriented reliable byte stream.
- **Read:** A read returns some bytes that have arrived.
- **Framing:** Those bytes are not required to be one application message, so the application-level protocol frames each message with a delimiter or a length prefix, under an agreed encoding.
- **UDP:** It is connectionless.
- **`accept`:** There is no `accept`.
- **Datagram:** A datagram arrives whole or not at all.

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
- **Second connection:** It waits in the listen backlog until some thread calls `accept`.
- **Blocked read:** The thread blocked in the read is not inside `accept`, so the second client is not served.

```java
while (true) {
    Socket client = ss.accept();
    handle(client);    // returns only when this client is done
}
```

- **Accept loop:** An accept loop that calls `accept`, handles one client until that client is finished, and then calls `accept` again serves the second client only after the first conversation ends.
- **Single-threaded server:** That pattern is a single-threaded server.
- **Concurrent clients:** Serving both clients at the same time takes another thread, or the non-blocking loop in the Reactor chapter.
:::
:::

:::check id=chk-tcp-udp
Which protocol preserves order and retransmits a lost segment?

- [ ] UDP
- [x] TCP
- [ ] IP

- **IP:** It routes packets and guarantees neither delivery nor order.
- **UDP:** It keeps each datagram whole and still gives no delivery guarantee.
- **TCP:** It is the row marked reliable, ordered, and connection-oriented.
:::

## Practice

:::problem id=ps9-tcp-udp title="TCP or UDP" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
A spell-check sends one word and one reply.

:::check id=ps9-tcp-udp-q1
Why does UDP fit that exchange?

- [x] UDP needs no handshake and keeps no connection state, so the request and the reply are two datagrams
- [ ] UDP retransmits a lost reply and reports a failed connection
- [ ] UDP frames the reply so the application can see where it ends

UDP needs no handshake and keeps no connection state, so one request and one reply are two datagrams. That is the reason to choose it for a tiny query.
:::

:::check id=ps9-tcp-udp-q2
Which of these hold for that UDP choice?

- [x] Either datagram can disappear
- [ ] The client can already tell a lost reply from a slow server
- [x] The client cannot tell a lost reply from a slow server unless it adds its own timeout and its own retry

The cost is that either datagram can disappear, and the client cannot tell a lost reply from a slow server unless the client adds its own timeout and its own retry.
:::

:::check id=ps9-tcp-udp-q3
TCP still makes the application decide where the reply {{=ends|begins|retries}}.

- **TCP:** It opens a connection, retransmits lost segments, and delivers bytes in order.
- **Reply:** The reply arrives, or the connection fails in a way the client can observe.
- **Cost:** The cost is the handshake and the framing of the stream.
- **Default:** When the user will simply try the request again by hand, TCP is the default.
- **UDP fit:** When a measurement can omit a sample, UDP fits: it is best-effort and does not retransmit.
:::
:::

:::problem id=ps9-encoding title="Encoding at the two ends" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
A Hebrew letter is encoded in UTF-8 as the bytes `D7 90`.

- **Server:** The server writes those bytes.
- **Client:** The client builds an `InputStreamReader` with the platform charset, which is not UTF-8.

:::check id=ps9-encoding-q1
What fails on the client?

- [ ] The socket drops `D7 90` before any reader sees it
- [x] The client decodes `D7 90` under the wrong charset, so the character is not the letter the server sent
- [ ] `BufferedReader` splits those two bytes into two lines before a charset is applied

The client decodes `D7 90` under the wrong charset, so the character is not the letter the server sent.
:::

:::check id=ps9-encoding-q2
Which construction is correct?

- [ ] `new BufferedReader(clientSocket.getInputStream())` and a `PrintWriter` with no charset
- [ ] `new InputStreamReader(clientSocket.getInputStream())` together with an `OutputStreamWriter` that names `"UTF-8"`
- [x] `new InputStreamReader(..., "UTF-8")` inside the `BufferedReader`, and `new OutputStreamWriter(..., "UTF-8")` inside the `PrintWriter`

- **Both directions** name UTF-8.
- **Reader** is `new InputStreamReader(clientSocket.getInputStream(), "UTF-8")`.
- **Writer** is `new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8")`.
:::

:::check id=ps9-encoding-q3
Which of these hold for that pair?

- [x] Both directions name UTF-8
- [x] `BufferedReader` splits lines after the charset is applied
- [ ] `PrintWriter` is the class that applies the charset on the way out

`BufferedReader` then splits lines. `InputStreamReader` and `OutputStreamWriter` are the classes that apply the charset.
:::

:::check id=ps9-encoding-q4
The class that applies the charset to the socket input is {{=InputStreamReader|BufferedReader|PrintWriter}}.

- **`InputStreamReader`:** It applies the charset on the way in.
- **`OutputStreamWriter`:** It applies it on the way out.
- **`BufferedReader`:** It splits lines.
:::
:::


:::problem id=ps10-stomp title="STOMP frames" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
A client wants to receive messages for `/topic/a`.

:::check id=ps10-stomp-q1
What does the client send first, and what does it send after it has read the reply?

- [ ] `SUBSCRIBE`, then `CONNECT`
- [ ] `MESSAGE`, then `SUBSCRIBE`
- [x] `CONNECT` with `accept-version` and `host`, then `SUBSCRIBE` with `id` and `destination`

- **First:** The client sends `CONNECT` with `accept-version` and `host`, and reads `CONNECTED`.
- **`version` header:** It is the version the session will use.
- **Then:** It sends `SUBSCRIBE` with an `id` such as `sub-1` and `destination:/topic/a`.
:::

:::check id=ps10-stomp-q2
Which of these hold after that `SUBSCRIBE`?

- [x] If the server cannot create the subscription, it sends `ERROR` with a `message` header
- [ ] The headers are rejected unless `id` comes before `destination`
- [x] A subscription that succeeded later delivers `MESSAGE` frames whose `destination` is `/topic/a`

- **`ERROR`:** If the server cannot create the subscription, it sends `ERROR`, with a `message` header.
- **`MESSAGE`:** A subscription that succeeded later delivers `MESSAGE` frames whose `destination` is `/topic/a`.
- **Header order:** The order of the headers does not matter.
:::

:::check id=ps10-stomp-q3
Every frame ends with {{=a null character|a newline|a length prefix}}.

Every frame ends with the null character `'\0'`.
:::

:::check id=ps10-stomp-q4
How does the client leave before closing the socket when it wants a receipt?

- [x] It sends `DISCONNECT` with a `receipt` header, and the server answers `RECEIPT`
- [ ] It sends `UNSUBSCRIBE` and waits for another `CONNECTED`
- [ ] It closes the socket, and the server answers `ERROR`

`DISCONNECT`, with a `receipt` header when the client wants one, is how the client leaves before closing the socket. The server answers `RECEIPT` when that receipt header was present.
:::
:::

:::examnote
The question replaces a delimiter with a length prefix, caps the number of clients, or asks for a small command protocol on top of the existing server. The trap is treating a TCP read as one whole message, or forgetting that UDP has no `accept`.
:::

:::problem id=exam-15b-q3 title="A spell-check server" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The message server in the appendix is a thread-per-client server: one thread for each accepted socket.

- **Handlers:** Handlers are capped at 10.
- **MessageLengthBasedTokenizer:** It frames a message as a length followed by that many bytes.
- **Other design:** The other design used a delimiter.
- **SpellMessageEncoder:** It turns a `SpellMessage` into bytes and back.
- **Spell-check server:** The spell-check server uses `SpellMessage`, that framing, and a thread-safe `LexiconBasedSpellChecker` with an empty constructor.

:::check id=exam-15b-q3-q1
Which body caps the running handlers at 10?

- [ ] `new Thread(connectionHandler).start()` for every accepted socket
- [ ] `Executors.newFixedThreadPool(10)` created inside each handler, after `accept` has returned
- [x] `ExecutorService executor = Executors.newFixedThreadPool(10);` and `executor.execute(connectionHandler)` for each accepted socket

- **Official solution:** It builds that pool and calls `executor.execute(connectionHandler)` for each accepted socket.
- **Accept loop:** The accept loop itself stays on the main thread.
- **Cap:** At most 10 handlers run.
- **Further connections:** They wait in the pool's queue, or the server can refuse them when that queue is what counts as "more than 10".
:::

:::check id=exam-15b-q3-q2
`nextMessage` returns only after the tokenizer has the integer length and then {{=that many payload bytes|a delimiter|one line}}.

- **Tokenizer** accumulates bytes until it has the integer length and then that many payload bytes.
- **`nextMessage`** returns only then.
- **Delimiter** is not examined.
:::

:::check id=exam-15b-q3-q3
Which of these hold for the encoder and the handler?

- [x] The encoder writes the request type, the language, and the word, in an agreed order, with the length prefix the tokenizer expects
- [x] `fromBytes` rebuilds a `SpellMessage`
- [ ] The handler examines a delimiter and skips `SpellMessageEncoder`

The handler is built with `new SpellMessageEncoder()`, `new MessageLengthBasedTokenizer()`, and a protocol that calls `LexiconBasedSpellChecker.check` or `getCorrections` according to `SpellMessage.getRequest()`.
:::

:::check id=exam-15b-q3-q4
Which of these hold for `SpellChecker` and the client?

- [ ] Each handler builds a private checker, because the implementation is not safe to share
- [x] `SpellChecker` stays the interface, and the handlers share one instance because the implementation is already thread-safe
- [x] The client opens a `Socket` to the host and port, sends one encoded `SpellMessage`, and reads one framed reply

- **`SpellChecker`:** It stays the interface.
- **Shared instance:** The implementation is already thread-safe, so the handlers may share one instance.
- **Client:** It opens a `Socket` to the host and port, sends one encoded `SpellMessage`, and reads one framed reply.
:::
:::

:::problem id=exam-16a-q3 title="A printer protocol" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A printer service was an RMI interface named `Printer.print(String)`.

- **Replacement:** A student replaced the generated stub and skeleton with a protocol server.
- **Handlers:** Handlers are capped at ten threads.
- **Framing:** Framing is a length prefix that fits in a Java `int`.
- **Earlier design:** The earlier design used a delimiter.
- **UDP:** The same service is also placed on UDP.
- **`Math`:** It has a stub and a skeleton in that style.

:::check id=exam-16a-q3-q1
Which body caps the printer handlers at ten?

- [x] `Executors.newFixedThreadPool(10)` around the connection handler
- [ ] `new Thread(connectionHandler).start()` for every accepted socket, with no pool
- [ ] `Executors.newFixedThreadPool(Integer.MAX_VALUE)` around the connection handler

`Executors.newFixedThreadPool(10)` around the connection handler, as in the official solution of the message server.
:::

:::check id=exam-16a-q3-q2
The length occupies the first {{=four bytes|delimiter|datagram}}. The bytes after that prefix are the body.

- **Length:** The first four bytes are the length.
- **Body:** The bytes after them are the body.
- **`Integer.MAX_VALUE`:** It is only the limit of the type.
- **Refusal:** The server still refuses a length that will not fit in the buffer you chose.
:::

:::check id=exam-16a-q3-q3
Which of these hold when the printer speaks UDP?

- [ ] `receive` runs only after `accept` returns a connected socket
- [x] `ServerSocket` and `Socket` are replaced by `DatagramSocket`, and there is no `accept`
- [x] One datagram must hold the entire frame, because the stream tokenizer was kept

- **DatagramSocket:** Replace `ServerSocket` and `Socket` with `DatagramSocket`.
- **No connection:** There is no connection and no `accept`.
- **`receive`:** It returns the sender.
- **`send`:** It uses that `SocketAddress`.
- **Length prefix in UDP:** It is optional in UDP when one datagram is one message.
- **This question:** It still wants the length, because the student kept the stream tokenizer.
- **Entire frame:** One datagram must then hold the entire frame.
:::

:::check id=exam-16a-q3-q4
Which of these hold for the stub and the skeleton?

- [x] `Math_Stub` implements `Math`, writes a command such as `add 2 3`, and reads the reply line
- [ ] `Math_Skel` implements `Math` on the client and turns a decimal result into the command string
- [x] `Math_Skel` parses the command, calls the real `Math`, and returns the decimal result
- [x] An exception on the server becomes an error line, which the stub turns into a `RemoteException`

- **`Math_Stub`:** It implements `Math`, and each method writes a command string such as `add 2 3` through the socket and reads the reply line.
- **`Math_Skel`:** It parses the command, calls the real `Math`, and returns the decimal result.
- **Server exception:** An exception on the server becomes an error line, which the stub turns into a `RemoteException`.
:::
:::

:::problem id=exam-17b-q3 title="Bank commands" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A bank server uses the command-invocation protocol from class.

- **`LOGIN name`:** The server answers `ack` and remembers the client.
- **`DEPOSIT money`:** It adds the amount to this client's balance and answers `ack`.
- **Third command:** It reads the balance.

:::check id=exam-17b-q3-q1
Which of these hold for `execute`?

- [x] Login stores the connection's name in the protocol's session and returns `"ack"`
- [ ] Deposit before login returns `"ack"` and creates the account
- [x] Deposit parses the amount, adds it to that session's account, and returns `"ack"`

- **Commands:** `LoginCommand`, `DepositCommand`, and `BalanceCommand` implement `Command<Bank>`.
- **Login `execute`:** It stores the connection's name in the protocol's session and returns `"ack"`.
- **Deposit `execute`:** It parses the amount, adds it to that session's account, and returns `"ack"`.
:::

:::check id=exam-17b-q3-q2
A deposit before login returns {{=an error string|"ack"|the balance}}.

A deposit before login returns an error string.
:::

:::check id=exam-17b-q3-q3
Which of these hold for the bank and the session?

- [ ] Each connection builds its own `Bank`
- [x] `Bank` is a map from name to balance, and its mutators are synchronized
- [x] Each connection gets its own protocol object, so the session name is not shared between clients

- **`Bank`:** It is a map from name to balance, and its mutators are synchronized.
- **Protocol object:** Each connection gets its own protocol object, so the session name is not shared between clients.
- **Shared bank:** The bank is shared, and the lock is what makes two deposits to the same account add both amounts.
:::

:::check id=exam-17b-q3-q4
Which `main` is correct?

- [ ] It builds a new `Bank` inside every connection
- [x] It builds one `Bank`, a protocol factory that closes over that bank, and the thread-per-client server from the appendix
- [ ] It builds the protocol factory and constructs the `Bank` on the first `LOGIN`

The server `main` builds one `Bank`, a protocol factory that closes over it, and the thread-per-client server from the appendix, on the port in the question.
:::
:::


A blocking read on a socket is where a naive server gets stuck.

[Reactor](topic:reactor) is how a server waits on many sockets without a thread for each one.
