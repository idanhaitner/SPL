---
id: serialization
title: Serialization
sources:
  - "Classes/Chapter 12 - Serialization.pptx"
---

The image server in the reactor spoke a private protocol: a file name in, the file's bytes out. The next server sends objects. An object is not a byte array until something walks its fields and writes them down. That walk is serialization (סיריאליזציה).

## What is written

:::definition id=def-serialization title="Serialization" source="Classes/Chapter 12 - Serialization.pptx"
Serialization is a representation of an object as a sequence of bytes. It includes the object's type, the shape of its fields, and the field values. Deserialization rebuilds an object from that sequence.

The pair stores primitive fields and object fields. It can move a value between machines and between JVMs, and the bytes can travel in a file or on a socket. What it does not store is the identity of the original heap object. The result of reading the bytes is a new object with the same field values.
:::

`Serializable` is a marker interface (ממשק סימון). It has no methods. It is a flag the JVM checks. `ObjectOutputStream` and `ObjectInputStream` refuse an object whose class does not implement it.

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

The enum constant is written as its name, the `String` as its characters, the `int` as its bits. On the way back, `readObject` allocates a new `Pet`. `copy == pet` is false. `copy.name.equals(pet.name)` is true.

![writeObject keeps name and age and skips the transient hash. readObject builds a different Pet whose hash starts null](../assets/figures/serialize-object.svg)

### What is skipped

Static fields belong to the class, not to the object, so they are not written. A field marked `transient` is not written either. The lecture's example is a cached hash:

```java
private transient Integer hash;
@Override public int hashCode() {
    if (hash == null) hash = compute();
    return hash;
}
```

After deserialization `hash` is null, and the next `hashCode` recomputes it. That is the point of `transient`: the field is a cache, or a thread, or a socket, something that has no meaning in another JVM. Forgetting `transient` on a `Thread` or an `OutputStream` makes `writeObject` throw, because those objects are not `Serializable`.

### Versions

Changing a class that is already `Serializable` is a compatibility problem. You wrote a file, then you changed the class, then you tried to read the file. `serialVersionUID` is the version number you assign so the JVM can tell those classes apart. The lecture's rule of thumb: an old stream is readable by the new class only when the change is on the compatible list.

Compatible: adding a field (it comes back as the default, `null` or `0` or `false`), changing `public` / `protected` / `private`, adding a `static` or `transient` field, reordering fields.

Incompatible: removing or changing the type of a field that is not `transient`, changing the class in the hierarchy in the ways the lecture lists as breaking. A mismatch of `serialVersionUID` fails the read even if the fields would have matched.

:::problem id=worked-transient-hash source="Classes/Chapter 12 - Serialization.pptx" kind=worked solution_origin=source
`Pet` is serialized with `name == "A"` and a cached `hash` that was already computed. The field is `transient`. What does `hash` contain in the object `readObject` returns, and what does `name` contain?

:::solution
`name` is `"A"`, because an ordinary object field is part of the stream. `hash` is null, because `transient` fields are not written and the new object starts from the default. The first `hashCode` on the copy recomputes the cache. The two `Pet`s are different objects.
:::
:::

:::check id=chk-marker
Why does `class Pet` without `implements Serializable` fail at `writeObject`?

- [ ] Because `Pet` has no `writeObject` method of its own
- [x] Because `Serializable` is the marker the stream checks, and it declares no methods
- [ ] Because `final` classes cannot be serialized

The lecture calls `Serializable` a marker interface: no methods, and the streams refuse the object without it.
:::

:::trap
A field that points at a non-serializable object fails the whole `writeObject`, even if you never intended to send that field. Mark it `transient` and restore it after the read, or do not point at it from a serializable object.
:::

:::trap
Relying on the computed `serialVersionUID` means a harmless-looking edit changes the id and old files stop loading. The lecture wants an explicit id when the class is part of a protocol.
:::

A reactor protocol can pass a `MessageEncoderDecoder<Serializable>` around these bytes. The encoder is `ObjectOutputStream` on the way out and `ObjectInputStream` on the way in, framed so the decoder knows when a stream chunk ends. [Persistence](topic:persistence) is the other way to keep an object, and the lecture opens by saying why a pile of serialized files is a bad database: you cannot search one field without reading every object, updates rewrite the whole graph, and transactions are your problem.
