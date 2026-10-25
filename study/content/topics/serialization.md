---
id: serialization
title: The command-invocation server
blurb: "Serialization, and a server that runs commands its clients send as Java objects."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 12 - Serialization.pptx"
---

The protocols so far were defined in detail, byte by byte. This chapter builds a server whose protocol has only one kind of message: a Java object that is a command, which the server runs on its data. To send such objects, they are turned into bytes, which is called serialization.

- **Motivation:** why a server would run commands its clients send it.
- **Serialization:** how Java turns an object into bytes and back, and which fields it leaves out.
- **The command-invocation server:** the command interface, the protocol, the object encoder-decoder, and a news-feed example, with the server and a client.

## Motivation

- **The protocol implementations so far relied on a detailed definition, specific to bytes,** so you had to implement a specific encoder-decoder (`MessageEncoderDecoder`) and a specific "processor" (`MessagingProtocol`) for every protocol. That is complicated and tiring, as you will see in the assignment. You would like to let a client send the server a Java object that represents the request, together with its implementation in Java. In the design here, that means a protocol written in Java, even if it is written in Java. Then the replies the server sends are handled the same way.
- **More broadly:** you can think of a server that holds some data structure, and lets clients define what operation to perform on it. In this model, the server does not define a set of commands that can be sent to it, but lets the client send its own command on the server's data, and returns the result to it.
  - **For example:** a server holds a data structure with all the operations on the stock market. A client can formulate a command that runs its own specific algorithm on that data (to decide which shares are worth buying), and send it to the server. The server runs it and returns the value the command returned.
  - **In our implementation,** for technical reasons of security, a client will not be allowed to send the server commands (that is, classes in Java) that the server does not know.

So define the pattern of a **command-invocation server**: a server whose protocol includes only one kind of message, receiving a "command" from the client, running it on its data, and returning the returned value to the client.

- **The client sends an object in Java,** with no need to encode it into an array of bytes according to the type of the command. The server needs no parsing of the message's structure, but simply runs the command by calling an agreed method.
- **The client can send any command** that works on the data structure kept by the server.

## Serialization in Java

A command and its result must travel over the network, so they must be turned into bytes and back.

:::definition id=def-serialization title="Serialization" source="materials/lectures/Chapter 12 - Serialization.pptx"
Serialization is the representation of an object as a sequence of bytes.

- **What the bytes record:** the object's type, the shape of its fields, and the values of those fields.
- **Deserialization:** this is the reverse step, which builds an object back from the bytes.
- **Which fields survive:** both primitive fields and fields that refer to other objects are preserved.
- **Where the bytes go:** they can be written to a file or sent through a socket, so they can move between machines and between JVMs.
- **What is not preserved:** the identity of the original heap object. Reading creates a new object with the same field values.
:::

`Serializable` is a marker interface, which means it declares no methods at all.

- **Its only job:** it is a flag that says the class agrees to be serialized.
- **What happens without it:** `ObjectOutputStream` refuses to write an object whose class does not implement `Serializable`, and throws `NotSerializableException`.

:::check id=chk-marker
Why does `class Pet` without `implements Serializable` fail in `writeObject`?

- [ ] Because `Pet` has no `writeObject` method of its own
- [x] Because `Serializable` is the marker interface the stream checks, and it declares no methods
- [ ] Because `final` classes cannot be serialized

`Serializable` is a marker interface. It has no methods, and the stream refuses any object whose class does not implement it.
:::

The class only has to declare `implements Serializable`.

```java
public final class Pet implements Serializable {
    public enum Type { DOG, CAT }
    public final String name;
    public final Type type;
    public final int age;

    public Pet(String name, Type type, int age) {
        this.name = name;
        this.type = type;
        this.age = age;
    }
}
```

**Writing:** `writeObject` turns the object into bytes and writes them to the file.

```java
Pet pet = new Pet(name, type, age);
try (var out = new ObjectOutputStream(Files.newOutputStream(path))) {
    out.writeObject(pet);
}
```

**Reading:** `readObject` builds a new `Pet` from those bytes. It returns `Object`, so the result is cast back to `Pet`.

```java
try (var in = new ObjectInputStream(Files.newInputStream(path))) {
    Pet copy = (Pet) in.readObject();
}
```

Each field is written in the form that suits its type.

- **The enum field:** an enum constant is written by its name, such as `DOG`.
- **The `String` field:** a `String` is written as its characters.
- **The `int` field:** an `int` is written as its raw bits.
- **Reading back:** `readObject` allocates a brand-new `Pet` and fills its fields from the bytes.
- **Same values, different object:** `copy == pet` is false, but `copy.name.equals(pet.name)` is true.

![writeObject saves name and age and skips the hash, which is transient. readObject builds another Pet whose hash starts as null](../../web/public/figures/serialize-object.svg)

### Omitted fields

Some fields are never written to the stream.

- **Static fields:** they belong to the class rather than to any one object, so the stream leaves them out.
- **`transient` fields:** the keyword `transient` tells the stream to skip the field. A cached hash code is the usual example.

```java
private transient Integer hash;
@Override public int hashCode() {
    if (hash == null) hash = compute();
    return hash;
}
```

After deserialization, `hash` is `null`, so the next call to `hashCode` computes it again.

- **When to use `transient`:** mark a field `transient` when its value has no meaning in another JVM, such as a cache, a thread, or a socket.
- **What happens if you forget:** a field that holds a `Thread` or an `OutputStream` makes `writeObject` throw, because those classes are not `Serializable`.

:::problem id=worked-transient-hash title="A transient field" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=worked solution_origin=source
`pet` was serialized after `hashCode` had already filled the cache. In the object that `readObject` returns, what does `hash` contain, and what does `name` contain?

```java
public final class Pet implements Serializable {
    public final String name = "A";
    private transient Integer hash;
}
```

:::solution
- **`name`:** it is `"A"`, because an ordinary field is part of the stream.
- **`hash`:** it is `null`, because a `transient` field is not written, so the new object gets the default value.
- **The first `hashCode` call on the copy:** it finds `null` and computes the cache again.
- **Identity:** the copy and the original are two different objects.
:::
:::

:::trap
If a field refers to an object that cannot be serialized, the whole `writeObject` call fails, even if you never meant to send that field.

- **The fix:** mark that field `transient` so it stays out of the stream, and set it again yourself after the read.
- **The rule of thumb:** everything reachable from a serializable object should itself be serializable, or be marked `transient`.
:::

### serialVersionUID

Changing a class that is already `Serializable` creates a compatibility problem: you wrote a file, then changed the class, and now you try to read the old file.

- **`serialVersionUID`:** this is a version number you assign to the class, so the JVM can tell whether the stream and the class match.
- **The basic rule:** the new class can read an old stream only when every change since then is on the compatible list.
- **Adding a field is compatible:** the new field is filled with its default value, which is `null`, `0`, or `false`.
- **Other compatible changes:** changing a field between `public`, `protected`, and `private`, adding a `static` or `transient` field, and reordering fields.
- **Incompatible changes:** removing a field that is not `transient`, changing a field's type, and changing the class hierarchy.
- **A mismatched `serialVersionUID`:** the read fails, even if the fields themselves would have matched.

:::trap
- **The risk of leaving it out:** if you do not declare `serialVersionUID`, Java computes one from the class. Even a harmless-looking edit changes that number, and old files stop loading.
- **The fix:** declare an explicit `serialVersionUID` on every class that is part of a file format or a protocol.
:::

## Building the command-invocation server

### 1. The command

Define a "command" on a data structure of type `T` (the type of the information the server holds).

```java
public interface Command<T> extends Serializable {
    Serializable execute(T data);
}

```

- **The command must be `Serializable`,** and so must the value returned from the method `execute`, because the command and its reply move over the network.
- **The `Serializable` interface** defines an object that can be "moved" over the network, with two methods: `writeObject`, which turns an object into an array of bytes ("encode"), and `readObject`, which builds an object again from an array of bytes ("decode").
- **The good news:** every class in Java that is declared to implement `Serializable` gets an automatic implementation of these methods, so there is no need to implement the interface yourself.

### 2. The protocol

Define the server's protocol as running a command on the data structure it keeps.

```java
public class RemoteCommandInvocationProtocol<T> implements MessagingProtocol<Serializable> {

    private T data;

    public RemoteCommandInvocationProtocol(T data) {
        this.data = data;
    }

    @Override
    public Serializable process(Serializable msg) {
        return ((Command) msg).execute(data);
    }

    @Override
    public boolean shouldTerminate() {
        return false;
    }
}

```

### 3. The encoder-decoder

Define the server's `MessageEncoderDecoder`, which encodes commands and replies into bytes. Remember that the commands and the replies are already defined as `Serializable`, so they already implement a way to turn a message into an array of bytes (the method `writeObject`), and to build it again from a representation like this as an array of bytes (the method `readObject`). All that is needed is to match the signatures of `Serializable`'s `readObject` and `writeObject` to those of `encode` and `decodeNextByte` in the server's `MessageEncoderDecoder` interface.

**Technical details:**

- **`encode`:** define the structure of the encoded message as an array that includes four bytes for the length of the encoded command, and then the rest of the bytes in the array, which describe the command, according to the policy implemented in `writeObject`.
- **`decodeNextByte`:**
  - define two lists of bytes: one for the first four bytes, which give the size of the object (`lengthBytes`), and a second for storing the bytes of the object itself (`objectBytes`),
  - when one of the first four bytes arrives (recognized by the size of `lengthBytes`), store it in the first array (`lengthBytes`). When the array is filled with the first four bytes that arrived, turn them into a number, so you know how many bytes to expect for the command itself (the field `objectLength`),
  - when the bytes of the command itself arrive, store them in the second array (`objectBytes`). Once all of them have arrived (you know how many bytes to expect, `objectLength`), turn them into an object with a call to `Serializable`'s `readObject`.

```java
public class ObjectEncoderDecoder implements MessageEncoderDecoder<Serializable> {

    private List<Byte> lengthBytes = new LinkedList<Byte>();
    private List<Byte> objectBytes = new LinkedList<Byte>();
    private int objectLength = 0;

    @Override
    public byte[] encode(Serializable message) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();

        // placeholder for the object size
        for (int i = 0; i < 4; i++)
            bytes.write(0);

        // encode the message to byte-array according to the writeObject method of Serializable
        ObjectOutput out = new ObjectOutputStream(bytes);
        out.writeObject(message);
        out.flush();
        byte[] result = bytes.toByteArray();

        // now write the object size
        intToBytes(result.length - 4, result);
        return result;
    }

    @Override
    public Serializable decodeNextByte(byte nextByte) {
        if (lengthBytes.size() < 4) {
            // indicates that we are still reading the length
            lengthBytes.add(nextByte);
            if (lengthBytes.size() == 4)
                objectLength = bytesToInt(lengthBytes.toArray());
        } else {
            objectBytes.add(nextByte);
            if (objectBytes.size() == objectLength) {
                ObjectInput in = new ObjectInputStream(
                    new ByteArrayInputStream(objectBytes.toArray()));
                Serializable result = (Serializable) in.readObject();
                objectBytes.clear();
                lengthBytes.clear();
                return result;
            }
        }
        return null;
    }

    private static void intToBytes(int i, byte[] b) {
        b[0] = (byte) (i >> 24);
        b[1] = (byte) (i >> 16);
        b[2] = (byte) (i >> 8);
        b[3] = (byte) i;
    }

    private static int bytesToInt(byte[] b) {
        // this is the reverse of intToBytes.
        // note that for every byte, when casting it to int,
        // it may include some changes to the sign bit, so we remove those
        // by anding with 0xff
        return ((b[0] & 0xff) << 24)
             | ((b[1] & 0xff) << 16)
             | ((b[2] & 0xff) << 8)
             | (b[3] & 0xff);
    }
}

```

**Food for thought:** what happens if the server does not know the class of the command the client sent?

- **In the current code,** a `ClassNotFoundException` is thrown in the server, during `readObject`, because the class is not known (it is not in its class-path).
- **The current code assumes** that the server knows all the classes of the commands the client sends. In other words, the client cannot send any command it wants (unlike the second motivation).
- **That approach is also right in terms of security:** it is risky to let a client run any code it wants on the server's computer.

If you wanted to support it after all:

- **you would need to define a "security" component in the server,** with a definition of what is allowed and what is forbidden (you can read data but not change it, you cannot write to disk, and so on),
- **you would need to include in the serialization** not only a description of the command object, but also the code of the command's class (its `Class` object, which is already defined as `Serializable`). Something like:
  - **`encode`:** four bytes for the size of the representation of the command's class, the representation of the command's class, four bytes for the size of the representation of the command object, and the representation of the command object,
  - **`decodeNextByte`:** a matching interpretation of the bytes of the array as the encoding of the class, the bytes for the size of the encoded command, and the bytes for the encoding of the command,
- **in addition,** after `readObject` creates the class's `Class` object (after `readObject` on the array of bytes that describes the command's class), you would have to load it into the memory of the server's process (you can do that with a `ClassLoader`),
- **if the class depends on other classes,** they would have to be sent too. In other words, the mechanism is not simple.

There are systems that support this at some level of abstraction, so they can also support clients that send commands as classes in other languages.

:::check id=chk-object-frame
The `ObjectEncoderDecoder` has received four bytes that encode 120, and then 119 more bytes. What does the next call to `decodeNextByte` return?

- [ ] `null`, because the length bytes are read again for every byte
- [x] the decoded `Serializable` object, because that byte is the 120th byte of the object
- [ ] an exception, because 120 bytes is too many for one object

- **The first four bytes** are the length prefix, so `objectLength` is 120.
- **After 119 object bytes,** one more completes the object, so `readObject` runs on all 120 bytes and the result is returned.
- **Both lists are then cleared,** so the next byte starts the length prefix of the next message.
:::

### 4. A data structure: a news feed

To run a server like this as an example, define the data structure it keeps: for example, news items on different topics.

```java
public interface NewsFeed {
    void publish(String category, String news);
    List<String> fetch(String category);
}

public class NewsFeedImpl implements NewsFeed {

    private ConcurrentHashMap<String, ConcurrentLinkedQueue<String>> newsPerCategory =
        new ConcurrentHashMap<>();

    public void publish(String category, String news) {
        ConcurrentLinkedQueue<String> queue =
            newsPerCategory.computeIfAbsent(category, (k) -> new ConcurrentLinkedQueue<>());
        queue.add(news);
    }

    public List<String> fetch(String category) {
        ConcurrentLinkedQueue<String> queue = newsPerCategory.get(category);
        if (queue == null) {
            return new ArrayList<>(0);   // empty
        } else {
            return new ArrayList<>(queue);   // copy of the queue, arraylist is serializable
        }
    }
}

```

- **Why the concurrent collections:** the reactor's worker threads run several commands at once on this one shared object, so both the map and each queue must be thread-safe.

### 5. Running the server

```java
public class NewsFeedServer {

    public static void main(String[] args) {
        NewsFeed feed = new NewsFeedImpl();   // one shared object

        new Reactor(
            7777,   // port
            () -> new RemoteCommandInvocationProtocol<Serializable>(feed),
            () -> new ObjectEncoderDecoder<Serializable>(),
            20
        ).serve();
    }
}

```

### 6. Commands on the news feed

**Fetching the news on a topic:**

```java
public class FetchNewsCommand implements Command<NewsFeed> {

    private String category;

    public FetchNewsCommand(String category) {
        this.category = category;
    }

    public Serializable execute(NewsFeed feed) {
        return feed.fetch(category);
    }
}

```

**Publishing a news item on a topic:**

```java
public class PublishNewsCommand implements Command<NewsFeed> {

    private String category;
    private String news;

    public PublishNewsCommand(String category, String news) {
        this.category = category;
        this.news = news;
    }

    public Serializable execute(NewsFeed feed) {
        feed.publish(category, news);
        return "OK";
    }
}

```

### 7. A client

For example, a client that publishes and receives news on different topics. A helper class makes it easy to send requests to the server and receive its replies.

```java
public class RCIClient implements Closeable {

    private final ObjectEncoderDecoder encdec;
    private final Socket sock;
    private final BufferedInputStream in;
    private final BufferedOutputStream out;

    public RCIClient(String host, int port) throws IOException {
        sock = new Socket(host, port);
        encdec = new ObjectEncoderDecoder();
        in = new BufferedInputStream(sock.getInputStream());
        out = new BufferedOutputStream(sock.getOutputStream());
    }

    public void send(Command<?> cmd) throws IOException {
        out.write(encdec.encode(cmd));
        out.flush();
    }

    public Serializable receive() throws IOException {
        int read;
        while ((read = in.read()) >= 0) {
            Serializable msg = encdec.decodeNextByte((byte) read);
            if (msg != null) {
                return msg;
            }
        }
        throw new IOException("disconnected before complete reading message");
    }

    @Override
    public void close() throws IOException {
        out.close();
        in.close();
        sock.close();
    }
}

```

The client program:

```java
public class NewsFeedClientMain {

    public static void main(String[] args) throws Exception {
        RCIClient c = new RCIClient(args[0], 7777);
        c.send(new PublishNewsCommand("jobs",
            "System Programmer, knowledge in C++. call 0x134693F"));
        c.receive();   // ok

        c.send(new FetchNewsCommand("jobs"));
        List<String> newss = (List<String>) c.receive();
        for (String news : newss)
            System.out.println(news);
    }
}

```

The full code is in the course's class material.

To sum up, the command-invocation server has one message type, a serializable command, which the server runs on its data and answers with a serializable result. The framing is a four-byte length prefix, and Java's `writeObject` and `readObject` do the rest.

- **Next:** [Databases](topic:persistence) asks how to keep data after the process ends, and why files of serialized objects are a poor way to do it.
