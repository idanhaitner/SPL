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

## Practice

:::problem id=prac-ser-fields title="What survives the trip" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=exercise solution_origin=derived
A `Player` is written with `writeObject`, and `readObject` then builds `copy` from those bytes. Before the write, the program ran `Player p = new Player("Noa", 80);`, `p.cachedRank = 3;`, and `Player.total = 7;`. Here is the class.

```java
public class Player implements Serializable {
    public static int total = 0;
    public String name;
    public int score;
    public transient Integer cachedRank;

    public Player(String name, int score) {
        this.name = name;
        this.score = score;
    }
}
```

:::check id=prac-ser-fields-q1
Which of these are true of `copy`?

- [ ] `copy == p` is true
- [x] `copy.name.equals(p.name)` is true
- [x] `copy.score` is 80
- [ ] `copy.cachedRank` is 3

- **`copy == p` is false:** `readObject` builds a brand-new object, so the identity of the original is not preserved.
- **`name` and `score` survive:** ordinary fields are part of the stream, so the new object has the same values.
- **`cachedRank` does not:** the keyword `transient` tells the stream to skip that field.
:::

:::check id=prac-ser-fields-q2
The file moves to a different JVM, where `Player.total` is still 0, and that JVM reads the file. What is `Player.total` there after the read?

- [x] 0
- [ ] 7
- [ ] The read fails, because the two values of `total` do not match

- **Why 0:** a `static` field belongs to the class, not to any one object, so the stream leaves it out. The read has nothing to put into it.
- **Why not 7:** the value 7 was never written to the file.
- **Why the read does not fail:** `total` is not in the stream, so there is nothing to compare.
:::

:::check id=prac-ser-fields-q3
In `copy`, `cachedRank` is {{=null|0|3}}. If it were declared `transient int` instead, it would be {{=0|null|3}}.

A `transient` field is not written, so the new object gets the default value of its type. `Integer` is a reference to an object, so its default is `null`, while the default of an `int` is 0.
:::
:::

:::problem id=prac-ser-thread-field title="A field that breaks the write" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=exercise solution_origin=derived
`Session` implements `Serializable`, and one of its fields holds a `Thread`.

```java
public class Session implements Serializable {
    public String user;
    public Thread worker;

    public Session(String user, Thread worker) {
        this.user = user;
        this.worker = worker;
    }
}
```

:::check id=prac-ser-thread-field-q1
The program calls `out.writeObject(new Session("Noa", new Thread()))`. What happens?

- [x] `writeObject` throws, because the `Thread` class is not `Serializable`
- [ ] It works, because `Session` implements `Serializable`
- [ ] It works, and the stream silently skips `worker`
- [ ] The compiler rejects the class `Session`

- **Why it throws:** everything reachable from a serializable object must itself be serializable, or be marked `transient`. `worker` refers to a `Thread`, which is neither.
- **Why `implements Serializable` on `Session` is not enough:** it speaks only for `Session`, not for the objects its fields refer to.
- **Why it does not skip the field:** the stream skips only `static` and `transient` fields. `worker` is neither.
- **Why the compiler accepts it:** the failure comes when `writeObject` runs.
:::

:::check id=prac-ser-thread-field-q2
You still want to send `user`. Which change fixes the write?

- [x] Mark `worker` as `transient`, and set it again yourself after the read
- [ ] Add a `serialVersionUID` to `Session`
- [ ] Make `worker` `private`
- [ ] Wrap the call to `writeObject` in a `try` and `catch`

- **The fix:** a `transient` field stays out of the stream, and a thread has no meaning in another JVM anyway.
- **`serialVersionUID`:** it is a version number. It does not change which fields are written.
- **`private`:** access rules do not matter to the stream, so a `private` field is still written.
- **`try` and `catch`:** you would catch the failure, but the session would still not be written.
:::

:::check id=prac-ser-thread-field-q3
After the fix, in the object that `readObject` returns, `user` is {{=Noa|null|empty}} and `worker` is {{=null|the same thread|a new thread}}.

`user` is an ordinary field, so it is in the stream. `worker` is `transient`, so it was not written and the new object gets the default value. If the object needs a thread, your code must set one after the read.
:::
:::

:::problem id=prac-ser-version title="Reading an old file" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=exercise solution_origin=derived
A file was written with this version of the class. Now you change the class and try to read that old file.

```java
public class Player implements Serializable {
    private static final long serialVersionUID = 1L;
    public String name;
    public int score;
}
```

:::check id=prac-ser-version-q1
After which of these single changes can the new class still read the old file?

- [x] Add a field `public int level;`
- [x] Swap the order of `name` and `score`
- [x] Change `score` from `public` to `private`
- [ ] Change `score` from `int` to `String`
- [ ] Change `serialVersionUID` to `2L`

- **Compatible:** adding a field, reordering fields, and changing a field between `public`, `protected`, and `private` are all on the compatible list.
- **Changing a field's type:** this is on the incompatible list, because the bytes in the file hold an `int`.
- **Changing `serialVersionUID`:** a mismatch makes the read fail, even if the fields themselves would have matched.
:::

:::check id=prac-ser-version-q2
You add `public int level;` and `public String nickname;`, then read the old file. In the new object, `level` is {{=0|80|-1}} and `nickname` is {{=null|Noa|empty}}.

The old file has no values for the new fields, so each one is filled with its default value: 0 for an `int` and `null` for a reference. The `score` and `name` values in the file stay with their own fields.
:::

:::check id=prac-ser-version-q3
Another class declares no `serialVersionUID`. You write a file, add one small helper method to the class, and the old file no longer loads. Why?

- [x] Java computed the version number from the class, and the edit changed that number
- [ ] The bytes hold the code of every method, and the file has no code for the new one
- [ ] Adding a method changes the order of the fields
- [ ] A class with methods cannot be serialized

- **The reason:** without a declared `serialVersionUID`, Java computes one from the class. Even a harmless-looking edit changes it, so the stream and the class no longer match.
- **The fix:** declare an explicit `serialVersionUID` on every class that is part of a file format or a protocol.
- **Why not the method code:** the bytes record the object's type, the shape of its fields, and the values of those fields.
- **Why not the field order:** a new method does not touch the fields.
- **Why not "cannot be serialized":** classes with methods are serialized all the time, as `Pet`'s `hashCode` shows.
:::
:::

:::problem id=prac-ser-frame title="Following the length prefix" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`ObjectEncoderDecoder` frames each object with a four-byte length, most significant byte first. The bytes below are written in hexadecimal.

```java
static int bytesToInt(byte[] b) {
    return ((b[0] & 0xff) << 24) | ((b[1] & 0xff) << 16)
         | ((b[2] & 0xff) << 8)  |  (b[3] & 0xff);
}
```

:::check id=prac-ser-frame-q1
The first four bytes that arrive are `00 00 01 02`. How many object bytes come next?

- [ ] 3
- [ ] 102
- [x] 258
- [ ] 33619968

- **Why 258:** the byte `01` is shifted left by 8, which gives 256, and the last byte adds 2.
- **Why not 3:** the four bytes are not added up as plain numbers. Each one has its own position.
- **Why not 102:** that only glues the last two bytes together as they are written, but each byte has its own weight.
- **Why not 33619968:** that reads the bytes in reverse order, with the least significant byte first.
:::

:::check id=prac-ser-frame-q2
The object in a message is 3 bytes long, so the message is 7 bytes long. Feed its bytes to `decodeNextByte` one at a time. How many calls return `null` before a call returns the object?

- [ ] 2
- [ ] 3
- [x] 6
- [ ] 7

- **The first 4 calls return `null`:** they collect the length. The fourth one sets `objectLength` to 3, and it still returns `null`.
- **The next 2 calls return `null`:** after them, only 2 of the 3 object bytes have arrived.
- **The seventh call returns the object:** that byte completes it, so 6 calls returned `null`.
- **Why not 2 or 3:** those counts forget that the length bytes go through the same function.
- **Why not 7:** that would mean the last byte of the object also returned `null`.
:::

:::check id=prac-ser-frame-q3
`writeObject` produces 50 bytes for an object. Then `encode` returns an array of {{=54|50|46}} bytes, and its first four bytes encode the number {{=50|54|4}}.

`encode` first reserves 4 bytes for the length, and then the object is written after them, so the array holds 4 + 50 bytes. It stores `result.length - 4` as the length, which counts only the object's bytes.
:::

:::check id=prac-ser-frame-q4
The last byte of a length is `0x80`. A Java `byte` is {{=signed|unsigned}}, so without `& 0xff` that byte would turn into {{=a negative int|128|0}}.

With the mask, the byte `0x80` contributes 128 to the length, as it should. Without it, the value would be negative, and the length would come out wrong.
:::
:::

:::problem id=prac-ser-command title="A new command for the news feed" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Here is one more command for the news-feed server. It reports how many items a category has.

```java
public class CountNewsCommand implements Command<NewsFeed> {
    private String category;

    public CountNewsCommand(String category) { this.category = category; }

    public Serializable execute(NewsFeed feed) {
        return feed.fetch(category).size() + " items";
    }
}
```

:::check id=prac-ser-command-q1
A client calls `c.send(new CountNewsCommand("jobs"))`, and the server knows this class. Where does `execute` run?

- [x] On the server, on the one `NewsFeed` object that all the clients share
- [ ] On the client, which then sends only the result to the server
- [ ] On the server, on a new `NewsFeed` created for this command
- [ ] Nowhere, until the server parses the command into one of its message types

- **Where it runs:** the protocol's `process` calls `execute(data)` on the server, with the server's data, and sends back what it returns.
- **Why not on the client:** the client sends the command as an object. It has no access to the server's data.
- **Why not a new feed:** the server creates one `NewsFeed` and passes it to every protocol, so all the clients see the same data.
- **Why no parsing:** the protocol has only one kind of message. The client's object brings its own behavior.
:::

:::check id=prac-ser-command-q2
The client has `CountNewsCommand`, but the class is not on the server's class path. What happens?

- [x] `readObject` on the server throws `ClassNotFoundException`
- [ ] The server runs the command, because the bytes carry its code
- [ ] `writeObject` on the client throws `NotSerializableException`
- [ ] `execute` runs and returns `null`

- **The reason:** the server cannot build an object of a class it does not know, so the read fails. A client can send only commands the server already knows.
- **Why the bytes do not help:** they hold the type, the shape of the fields, and their values, but not the code of the class.
- **Why the client's write works:** `Command` extends `Serializable`, so the class is serializable.
- **Why `execute` never runs:** the failure comes earlier, while the object is being built.
:::

:::check id=prac-ser-command-q3
`CountNewsCommand` can travel because `Command` {{=extends Serializable|declares writeObject|is a final class}}. Its reply can travel because `execute` returns a {{=Serializable|Command|Thread}}. To run it, the protocol's `process` only calls {{=execute|readObject|publish}}.

Both the command and its result cross the network, so both must be `Serializable`. Here the result is a `String`. Reading the bytes is the encoder-decoder's job, so `process` receives a ready object and just runs it.
:::
:::

To sum up, the command-invocation server has one message type, a serializable command, which the server runs on its data and answers with a serializable result. The framing is a four-byte length prefix, and Java's `writeObject` and `readObject` do the rest.

- **Next:** [Databases](topic:persistence) asks how to keep data after the process ends, and why files of serialized objects are a poor way to do it.
