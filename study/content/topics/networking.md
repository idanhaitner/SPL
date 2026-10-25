---
id: networking
title: Communication between processes
blurb: "Why processes communicate, network layers, sockets and ports, and UDP versus TCP."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 10 - Networking.pptx"
  - "materials/sessions/PS9 2026.pptx"
---

So far the course dealt with concurrency of several threads inside one process. This chapter moves to processes that talk to each other, usually on different computers.

- **Why processes communicate:** the scenarios that need it, and the client-server architecture that this part of the course uses.
- **The network:** its layers, and the concepts of host, IP address, socket, and port.
- **The two kinds of connection:** UDP and TCP, and a print server written with each.

## Why processes communicate

So far the course dealt with a concurrency model of several threads in one process:

- **one memory space** for all the threads (a shared heap),
- **a stack of its own** for each thread,
- **autonomy over the processor** (even when the processor is shared by several threads, the values in the registers are specific to each thread).

It turns out that this concurrency model, in which several tasks run concurrently in one process, is not enough for common applications that need concurrency. For example:

1. **Several processes on the same computer that need to cooperate,** and in particular to "talk" to each other (less common).
   - **An application for building a timetable** (a real case):
     - the scheduling engine (an implementation of the algorithm that solves all the constraints) is a process in the logic language Prolog,
     - the user interface is implemented in Java,
     - so ongoing communication is needed between the two processes.
   - **An application for managing a newsroom:**
     - the application is in C++, and includes a word processor,
     - the spell check is done by a separate process (because of the complexity of a spell check in Hebrew), `ispell` or `aspell`.
2. **Two processes running on different computers.**
   - **The client-server architecture:**

```text
Web Client  -- GET www.cs.bgu.ac.il/~spl212/a.html\n -->  Web Server
Web Client  <-------------- a.html -------------------  Web Server

Price Client -- GET-PRICE iphone4.1; -->  Price Server
Price Client <-- [<store17, 1500>, <store48, 1600>]; --  Price Server

```

   - **The peer-to-peer architecture,** in which every process talks directly to several others, with no central server.
3. **A cluster of computers in the cloud** that run a "big data" job together (cloud computing), or a complex algorithm that needs more concurrency than the number of threads possible in one process.

This part of the course focuses on the client-server architecture, the most common one. In particular, it goes through the different communication problems for its design, up to defining a general, efficient server pattern.

## The architecture of the network

Communication between different computers on such a network relies on different levels of communication and services, or, if you like, an architecture of several "layers".

To explain this, look at what happens when you send a letter to a friend.

| Sender | Post office | Receiver |
| --- | --- | --- |
| Write the letter, put it in an envelope, mark the sender and receiver addresses, drop the envelope in the mailbox | Collect letters from the mailboxes, move them to the local post office, sort them by address, move them between post offices along a route that fits the addresses, check that no part was lost on the way | Take the letter out of the mailbox, read it, answer it |

A computer network works the same way, in layers.

| Layer | What it does | Unit of data |
| --- | --- | --- |
| **Application** | The layer we write in: applications, programs that rely on communication with other processes. Communication with other processes goes through an interface given by the transport layer (a service of the run-time environment), with operations to receive or read and to write or send | Message |
| **Transport** | The abstraction of a direct connection between processes for the application layer. It is responsible for moving the information that arrives at the router to the right place in the local process, and in the other direction, for moving information sent by a process on the computer to the network layer. It also provides extra services (examples later). The existing implementations are the TCP and UDP protocols | Segment / datagram (דטגרם) |
| **Network** | Moving units of information across the network, along a route of "routers" from one remote node to another (implementing routing algorithms). It also defines the network addresses (IP) | Packet |
| **Data link** | Moving bits from one node to its neighbor. Error detection, error correction, and so on | Frame |

![Four layers, application on top, then transport, network, and link](../../web/public/figures/network-layers.svg)

The rest of the chapter relies on the services given by the transport layer.

## Concepts of communication between processes

- **Host:** a station on the network, a computer connected to the network.
- **IP address:** the address of a host on the network. The IP protocol of the network layer defines the address space as a number of 32 bits, displayed as four numbers in the range 0–255, for example `132.23.45.107`. You can also describe the address with a name such as `www.cs.bgu.ac.il`, when there is a name server, DNS, that translates such names into IP addresses.
- **Communication:** exchanging information between two processes running on hosts. The basic unit of information that passes through the network's sub-layers is called a packet.
- **Socket:** the interface given by the transport layer to processes that want to manage communication in the application layer. This interface usually includes operations of sending or writing, and receiving or reading.
  - You can think of a socket as an "opening" of the process to the outside, through which it can receive or send information (like a mailbox, or a telephone receiver).
  - In terms of the implementation: when you receive a socket from the transport layer, following a call to the system, the operating system defines two arrays of bytes, "buffers", for it: one holds the bytes to send, and the other the bytes that arrived from the network. The transport layer then moves the bytes from the network into the receive buffer, and sends bytes from the write buffer to the network.
- **Port:** to let a process manage several conversations at once, with several processes, you mark the different sockets the process uses (one for each conversation). The port number serves this purpose, like a telephone number, or a mailbox number in a building.
- **A note:** in practice, communication between two processes, through two sockets, can be identified uniquely by this quadruple:

```text
<source host address, source host port, target host address, target port>

```

:::definition id=def-host-port title="IP address and port" source="materials/lectures/Chapter 10 - Networking.pptx"

- **IP address:** the address that identifies a machine (a host) on the network.
- **Port:** a number that identifies one process or service on that host. Ports 1–1023 are reserved for well-known system services, such as HTTP on port 80.
- **Together:** an IP address and a port identify exactly one endpoint of a conversation.
:::

## Two kinds of connection

The transport layer provides two kinds of connection between processes. You can characterize such connections by several parameters.

- **Is the connection between the processes session-oriented, or datagram-oriented?**
  - **Session-oriented** (like a phone call):
    - a procedure for setting up the connection (which includes the address and so on) is needed, and the other side must be available at that moment,
    - a free transfer of bytes, in both directions, a "stream of bytes", with no need to state the address again and again,
    - the responsibility for interpreting the bytes as "messages" lies with the parties,
    - the parties decide when the conversation ends.
  - **Datagram-oriented** (like sending a letter by mail):
    - there is no setting up of a "connection", and the other side does not need to be connected right now,
    - the unit transferred is a "message", not just a stream of bytes, so the address must be stated in every message sent,
    - the receiver receives the bytes already in the structure of a message,
    - the connection ends after every message is received. There is no "conversation" in the simple sense; the conversation is a series of message transfers.
- **The "topology" of the connection** between the processes (in terms of the number of processes taking part, and the relations between them):
  - **unicast:** one process to one process,
  - **multicast:** one process to several processes.
- **The level of "extra services"** that come with the connection (examples below).

The two kinds of connection provided by the transport layer are:

- **UDP (User Datagram Protocol):**
  - datagram-oriented,
  - supports unicast and also multicast,
  - limited extra services:
    - **reliability:** if messages A and B were sent, they may not arrive (you may receive A or B, or neither), they may arrive in the reverse order (you receive B, A), but whatever arrives is free of errors (you will not receive C).
- **TCP (Transmission Control Protocol):**
  - session-oriented,
  - supports only unicast,
  - wider extra services:
    - **reliability:** the messages sent arrive (unless the network failed, or the processes crashed), in the order they were sent, with no errors (if A and B were sent, you will receive A, B),
    - **flow control:** control over the rate of sending messages, according to the load on the network, and the number of messages not yet handled,
    - ...

**The bottom line:** when you write applications or programs that want to send information to another process, you can ask for a socket from the transport layer according to one of the two kinds of connection, TCP or UDP.

In most cases TCP is chosen, because of its reliability, but there are quite a few applications that use UDP, because of its speed (video streaming, for example), or because they must send an alert to a group of processes that want that information.

In summary:

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

## A print server over UDP and over TCP

Implement a client-server program for printing strings on the screen: the client sends a string to the server, and the server prints it. Do it for both kinds of connection.

### UDP

```java
class UDPPrintClient {
    public static void main(String[] args) throws Exception {
        // 1. Get the address (host:port) of the server
        String serverIP = args[0];                 // 132.4.5.6
        int serverPort = Integer.parseInt(args[1]); // 7000

        // 2. Define the [udp] interface of the server (the 'Mail Box')
        DatagramSocket socket = new DatagramSocket();
        // 3. Define a packet for sending (the 'letter')
        String msg = "Hello World";                // the content
        DatagramPacket packet = new DatagramPacket(msg.getBytes(), msg.getBytes().length,
            InetAddress.getByName(serverIP), serverPort);   // (the 'envelope')
        // 4. Send the packet to the server ('put the envelope in the mail box')
        socket.send(packet);
        socket.close();
    }
}

class UDPPrintServer {
    public static void main(String[] args) throws Exception {
        // 1. Get the address port of which the server listens
        int port = Integer.parseInt(args[0]);      // 7000
        // 2. Define the [udp] interface of the clients (the 'Mail Box')
        DatagramSocket socket = new DatagramSocket(port);
        while (!Thread.currentThread().isInterrupted()) {
            // 3. Define an empty packet for receiving (an empty 'letter')
            // part of the application protocol, limited msg length
            byte[] content = new byte[256];
            DatagramPacket packet = new DatagramPacket(content, content.length);
            // 4. Receive a packet content from the client
            socket.receive(packet);
            String msg = new String(content, ...);
            System.out.println(msg);
        }
        socket.close();
    }
}

```

### TCP

```java
class TCPPrintClient {
    public static void main(String[] args) throws Exception {
        // 1. Get the address (host:port) of the server
        String serverIP = args[0];                  // 132.4.5.6
        int serverPort = Integer.parseInt(args[1]);  // 7000
        Socket socket = new Socket(serverIP, serverPort);
        String msg = "Hello World";
        for (byte b : msg.getBytes())
            socket.getOutputStream().write(b);
        // indicate end of message (for the case of TCP)
        socket.getOutputStream().write("\n");
        socket.close();
    }
}

class TCPPrintServer {
    public static void main(String[] args) throws Exception {
        // 1. Get the port of the server
        int port = Integer.parseInt(args[0]);       // 7000
        // 2. Define an interface for accepting new client connections ('switchboard')
        ServerSocket serverSocket = new ServerSocket(port);
        while (!Thread.currentThread().isInterrupted()) {
            // wait for some client connection
            Socket socket = serverSocket.accept();
            List<Byte> receivedBytes = new LinkedList<Byte>();
            while (true) {
                byte b = socket.getInputStream().read();
                if (b == '\n')
                    break;
                else
                    receivedBytes.add(b);
            }
            String msg = new String(receivedBytes.toArray(), ...);
            System.out.println(msg);
            socket.close();
        }
    }
}

```

**A TCP server** waits in `accept` for a client to connect. It then wraps the connection's byte streams in a reader and a writer that agree on an encoding (UTF-8).

```java
ServerSocket server = new ServerSocket(8080);
Socket client = server.accept();  // blocks until a client connects

BufferedReader in = new BufferedReader(
    new InputStreamReader(client.getInputStream(), "UTF-8"));
PrintWriter out = new PrintWriter(
    new OutputStreamWriter(client.getOutputStream(), "UTF-8"), true);
```

**A UDP server** has no connection to accept. It prepares a buffer and waits for the next datagram from anyone.

```java
DatagramSocket socket = new DatagramSocket(5000);
byte[] buf = new byte[1024];
DatagramPacket packet = new DatagramPacket(buf, buf.length);
socket.receive(packet);  // blocks until a datagram arrives
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
- **Serving both at once:** that needs a separate thread for each client, or the non-blocking loop from [Server design and the reactor](topic:reactor).
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

### What is fixed in this design

The design above makes a number of specific decisions.

- **Encoding the strings into bytes** is done in a specific way (Java's default, with `getBytes`).
- **[For TCP] The decision how to mark the boundaries of messages** (with a newline as the delimiter).
- **The internal structure of a message** (one parameter: the string to print).
- **The server's reaction to receiving a message** (printing on the screen).
- **When the conversation with a client ends** (after one message).
- **The way the server handles several clients** (with threads, serially).
- ...

So define a general server pattern that receives all the decisions above as parameters. That is the subject of [Server design and the reactor](topic:reactor).

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

To sum up, processes talk through sockets given by the transport layer, and choose between UDP, which sends whole datagrams with no connection or guarantees, and TCP, which keeps a reliable, ordered stream of bytes over a connection.

- **Next:** [Server design and the reactor](topic:reactor) builds a general server out of the decisions this print server made by hand.
