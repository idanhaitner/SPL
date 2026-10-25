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

### 1. A command

A command is an object that knows how to run itself on the server's data.

```java
public interface Command<T> extends Serializable {
    Serializable execute(T data);
}
```

- **`T`** is the type of the data the server holds.
- **The command, and what it returns, are `Serializable`,** because both travel over the network.

### 2. The protocol

The server's protocol has one rule: run the command on the data, and send back the result.

```java
public class RemoteCommandInvocationProtocol<T> implements MessagingProtocol<Serializable> {
    private T data;

    public RemoteCommandInvocationProtocol(T data) { this.data = data; }

    public Serializable process(Serializable msg) {
        return ((Command<T>) msg).execute(data);
    }

    public boolean shouldTerminate() { return false; }
}
```

No parsing, no list of message types: the client's object brings its own behavior.

### 3. The encoder-decoder

Java already turns a `Serializable` object into bytes (`writeObject`) and back (`readObject`). What is left is framing: where does one object end in the byte stream? The answer here is a **length prefix**.

**The message format:**

| Bytes | Content |
| --- | --- |
| first 4 | the length *n* of the object's bytes |
| next *n* | the object, as written by `writeObject` |

**`encode`** writes the object, then puts its length in front.

```java
public byte[] encode(Serializable message) {
    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    bytes.write(new byte[4]);                      // room for the length
    ObjectOutputStream out = new ObjectOutputStream(bytes);
    out.writeObject(message);
    out.flush();
    byte[] result = bytes.toByteArray();
    intToBytes(result.length - 4, result);         // fill in the length
    return result;
}
```

**`decodeNextByte`** first collects 4 bytes of length, then exactly that many bytes of object.

```java
public Serializable decodeNextByte(byte nextByte) {
    if (lengthBytes.size() < 4) {                  // still reading the length
        lengthBytes.add(nextByte);
        if (lengthBytes.size() == 4)
            objectLength = bytesToInt(lengthBytes);
        return null;
    }
    objectBytes.add(nextByte);                     // reading the object
    if (objectBytes.size() < objectLength)
        return null;
    Serializable result = readObjectFrom(objectBytes);
    lengthBytes.clear();
    objectBytes.clear();
    return result;
}
```

**The length as 4 bytes.** An `int` is split into its four bytes, most significant first, and put back together on the other side.

```java
static void intToBytes(int i, byte[] b) {
    b[0] = (byte) (i >> 24);
    b[1] = (byte) (i >> 16);
    b[2] = (byte) (i >> 8);
    b[3] = (byte) i;
}

static int bytesToInt(byte[] b) {
    return ((b[0] & 0xff) << 24) | ((b[1] & 0xff) << 16)
         | ((b[2] & 0xff) << 8)  |  (b[3] & 0xff);
}
```

`& 0xff` matters: a Java `byte` is signed, so a byte such as `0x80` would turn into a negative `int` without it.

:::check id=chk-object-frame
The `ObjectEncoderDecoder` has received four bytes that encode 120, and then 119 more bytes. What does the next call to `decodeNextByte` return?

- [ ] `null`, because the length bytes are read again for every byte
- [x] the decoded `Serializable` object, because that byte is the 120th byte of the object
- [ ] an exception, because 120 bytes is too many for one object

- **The first four bytes** are the length prefix, so `objectLength` is 120.
- **After 119 object bytes,** one more completes the object, so `readObject` runs on all 120 bytes and the result is returned.
- **Both lists are then cleared,** so the next byte starts the length prefix of the next message.
:::

**What if the server does not know the command's class?** `readObject` then throws `ClassNotFoundException`, because the class is not on the server's class path. So in this design a client can send only commands the server already knows, which is also the safe choice: letting clients run arbitrary code on the server is dangerous. Supporting unknown commands would need much more: sending the class's code along with the object, loading it with a `ClassLoader`, sending every class it depends on, and a security component that limits what such code may do.

### 4. An example: a news feed

The data the server holds: news items, by category.

```java
public interface NewsFeed {
    void publish(String category, String news);
    List<String> fetch(String category);
}
```

```java
public class NewsFeedImpl implements NewsFeed {
    private ConcurrentHashMap<String, ConcurrentLinkedQueue<String>> byCategory =
        new ConcurrentHashMap<>();

    public void publish(String category, String news) {
        byCategory.computeIfAbsent(category, k -> new ConcurrentLinkedQueue<>()).add(news);
    }

    public List<String> fetch(String category) {
        Queue<String> q = byCategory.get(category);
        return q == null ? new ArrayList<>() : new ArrayList<>(q);   // a serializable copy
    }
}
```

- **The collections are concurrent** because the reactor's workers run several commands on this one object at once.
- **`fetch` returns a copy,** an `ArrayList`, which is `Serializable` and safe to send.

**The commands** are tiny classes:

```java
public class PublishNewsCommand implements Command<NewsFeed> {
    private String category, news;
    ...
    public Serializable execute(NewsFeed feed) {
        feed.publish(category, news);
        return "OK";
    }
}

public class FetchNewsCommand implements Command<NewsFeed> {
    private String category;
    ...
    public Serializable execute(NewsFeed feed) {
        return feed.fetch(category);
    }
}
```

**The server** is the reactor, with this protocol and this encoder-decoder:

```java
NewsFeed feed = new NewsFeedImpl();      // one object, shared by all clients
new Reactor(7777,
            () -> new RemoteCommandInvocationProtocol<>(feed),
            () -> new ObjectEncoderDecoder(),
            20).serve();
```

**A client** sends commands and reads the replies. A small helper class, `RCIClient`, wraps a socket with the same encoder-decoder: `send(cmd)` writes `encdec.encode(cmd)`, and `receive()` feeds bytes to `decodeNextByte` until an object comes out.

```java
RCIClient c = new RCIClient("132.4.5.6", 7777);

c.send(new PublishNewsCommand("jobs", "System Programmer, knowledge in C++."));
c.receive();                                   // "OK"

c.send(new FetchNewsCommand("jobs"));
List<String> news = (List<String>) c.receive();
```

The full code is in the course's class material.

To sum up, the command-invocation server has one message type, a serializable command, which the server runs on its data and answers with a serializable result. The framing is a four-byte length prefix, and Java's `writeObject` and `readObject` do the rest.

- **Next:** [Databases](topic:persistence) asks how to keep data after the process ends, and why files of serialized objects are a poor way to do it.
