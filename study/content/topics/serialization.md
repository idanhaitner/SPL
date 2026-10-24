---
id: serialization
title: Serialization
sources:
  - "materials/lectures/Chapter 12 - Serialization.pptx"
---

This chapter shows how a program turns an object into bytes, so that a later run, or a different process, can rebuild the same object.

- **What is stored:** the bytes record the object's type, the names and types of its fields, and the values of those fields.
- **How Java does it:** a class opts in with `Serializable`, and two streams write and read the object.
- **Where it connects:** the reactor's file server becomes a server that sends whole objects.

## Writing and reading an object

Serialization (סיריאליזציה) records an object as a sequence of bytes, so that a later run, or another process, can rebuild it.

- **The image server** in the Reactor chapter received a file name and sent back the file's bytes.
- **An object server** sends whole objects instead of raw files.
- **The byte sequence** it sends records the object's type, the shape of its fields, and the field values.

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

### serialVersionUID

Changing a class that is already `Serializable` creates a compatibility problem: you wrote a file, then changed the class, and now you try to read the old file.

- **`serialVersionUID`:** this is a version number you assign to the class, so the JVM can tell whether the stream and the class match.
- **The basic rule:** the new class can read an old stream only when every change since then is on the compatible list.
- **Adding a field is compatible:** the new field is filled with its default value, which is `null`, `0`, or `false`.
- **Other compatible changes:** changing a field between `public`, `protected`, and `private`, adding a `static` or `transient` field, and reordering fields.
- **Incompatible changes:** removing a field that is not `transient`, changing a field's type, and changing the class hierarchy.
- **A mismatched `serialVersionUID`:** the read fails, even if the fields themselves would have matched.

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

:::check id=chk-marker
Why does `class Pet` without `implements Serializable` fail in `writeObject`?

- [ ] Because `Pet` has no `writeObject` method of its own
- [x] Because `Serializable` is the marker interface the stream checks, and it declares no methods
- [ ] Because `final` classes cannot be serialized

`Serializable` is a marker interface. It has no methods, and the stream refuses any object whose class does not implement it.
:::

:::trap
If a field refers to an object that cannot be serialized, the whole `writeObject` call fails, even if you never meant to send that field.

- **The fix:** mark that field `transient` so it stays out of the stream, and set it again yourself after the read.
- **The rule of thumb:** everything reachable from a serializable object should itself be serializable, or be marked `transient`.
:::

:::trap
- **The risk of leaving it out:** if you do not declare `serialVersionUID`, Java computes one from the class. Even a harmless-looking edit changes that number, and old files stop loading.
- **The fix:** declare an explicit `serialVersionUID` on every class that is part of a file format or a protocol.
:::

A Reactor protocol can carry these bytes inside a `MessageEncoderDecoder<Serializable>`.

- **The encoder and decoder:** the encoder writes with an `ObjectOutputStream`, and the decoder reads with an `ObjectInputStream`. Each message is framed, so the decoder knows where one object ends and the next begins.
- **The alternative:** [Persistence](topic:persistence) shows the other way to keep objects, in a database.
- **Why files of objects are a poor database:** searching on one field means reading every object, an update rewrites the whole object graph, and transactions are left to the application.
