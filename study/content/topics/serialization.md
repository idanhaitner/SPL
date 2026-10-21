---
id: serialization
title: Serialization
sources:
  - "materials/lectures/Chapter 12 - Serialization.pptx"
---

Serialization (סיריאליזציה) records an object as a byte sequence so a later run, or another process, can rebuild it. The image server in the Reactor chapter spoke a private protocol: a file name went in, and the file's bytes came out. The next server sends objects. An object becomes a byte array only when something walks its fields and writes them down. That byte sequence records the type, the shape of the fields, and the field values.

## What is written

:::definition id=def-serialization title="Serialization" source="materials/lectures/Chapter 12 - Serialization.pptx"
Serialization is a representation of an object as a sequence of bytes. The sequence records the type of the object, the shape of its fields, and the values of the fields. Deserialization builds an object back from that sequence.

The two operations preserve primitive fields and object fields. They can carry a value between machines and between JVMs, and the bytes can travel in a file or on a socket. Reading the bytes produces a new object with the same field values. The identity of the original heap object is not part of the sequence.
:::

`Serializable` is a marker interface. It has no methods. It is a flag the JVM checks. `ObjectOutputStream` and `ObjectInputStream` refuse an object whose class does not implement it.

```java
public final class Pet implements Serializable {
    public enum Type { DOG, CAT }
    public final String name;
    public final Type type;
    public final int age;
    public Pet(String name, Type type, int age) {
        this.name = name; this.type = type; this.age = age;
    }
}

Pet pet = new Pet(name, type, age);
try (var fileOut = Files.newOutputStream(path);
     var out = new ObjectOutputStream(fileOut)) {
    out.writeObject(pet);
}
try (var in = new ObjectInputStream(Files.newInputStream(path))) {
    Pet copy = (Pet) in.readObject();
}
```

An enum constant is written by its name, a `String` by its characters, and an `int` by its bits. On the way back, `readObject` allocates a new `Pet`. `copy == pet` is false. `copy.name.equals(pet.name)` is true.

![writeObject saves name and age and skips the hash, which is transient. readObject builds another Pet whose hash starts as null](../assets/figures/serialize-object.svg)

### What is left out

Static fields belong to the class, and every instance shares them, so the stream omits them. A field marked `transient` is omitted as well. A cached hash is the usual case:

```java
private transient Integer hash;
@Override public int hashCode() {
    if (hash == null) hash = compute();
    return hash;
}
```

After deserialization, `hash` is null, and the next `hashCode` computes it again. That is the point of `transient`: the field is a cache, or a thread, or a socket, something that has no meaning in another JVM. Forgetting `transient` on a `Thread` or an `OutputStream` makes `writeObject` throw, because those objects are not `Serializable`.

### Versions

Changing a class that is already `Serializable` is a compatibility problem. You wrote a file, then changed the class, then tried to read the file. `serialVersionUID` is the version number you assign so the JVM can tell these classes apart. An old stream stays readable by the new class only when the change is on the compatible list.

Compatible changes: adding a field (it comes back as the default, `null` or `0` or `false`), changing `public` / `protected` / `private`, adding a `static` or `transient` field, and changing the order of the fields.

Incompatible changes include removing a field that is not `transient`, changing a field's type, and changing the class hierarchy. A mismatch of `serialVersionUID` fails the read even when the fields would otherwise have matched.

:::problem id=worked-transient-hash title="A transient field" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=worked solution_origin=source
`pet` was serialized after `hashCode` had already filled the cache. What does `hash` contain in the object that `readObject` returns, and what does `name` contain?

```java
public final class Pet implements Serializable {
    public final String name = "A";
    private transient Integer hash;
}
```

:::solution
`name` is `"A"`, because an ordinary object field is part of the stream. `hash` is null, because `transient` fields are not written and the new object starts from the default. The first `hashCode` on the copy computes the cache again. The two `Pet` objects are different objects.
:::
:::

:::check id=chk-marker
Why does `class Pet` without `implements Serializable` fail in `writeObject`?

- [ ] Because `Pet` has no `writeObject` method of its own
- [x] Because `Serializable` is the marker interface the stream checks, and it declares no methods
- [ ] Because `final` classes cannot be serialized

`Serializable` is a marker interface. It has no methods, and the streams refuse an object that does not implement it.
:::

:::trap
A field that points at an object that cannot be serialized makes the whole `writeObject` fail, even when you did not mean to send that field. Mark the field `transient` and restore it after the read, or keep the non-serializable object out of the graph of a serializable one.
:::

:::trap
Relying on the computed `serialVersionUID` means an edit that looks harmless changes the identifier, and old files stop loading. Give the class an explicit identifier when it is part of a protocol.
:::

A Reactor protocol can carry these bytes inside a `MessageEncoderDecoder<Serializable>`. The encoder is an `ObjectOutputStream` on the way out and an `ObjectInputStream` on the way in, framed so the decoder knows when a chunk of the stream has ended. [Persistence](topic:persistence) is the other way to keep an object. A pile of serialized files is a poor database. A search for one field has to read every object, an update rewrites the whole graph, and transactions are left to the application.
