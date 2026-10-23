---
id: serialization
title: Serialization
sources:
  - "materials/lectures/Chapter 12 - Serialization.pptx"
---

This chapter is how a program records an object as bytes so a later run, or another process, can rebuild it.

- **What is stored** — type, field shape, and field values.
- **Java wiring** — `Serializable`, streams, and rebuilding an object.
- **From the reactor** — moving from an image-file server to an object server.

## Writing and reading an object

Serialization (סיריאליזציה) records an object as bytes so a later run, or another process, can rebuild it.

- **Image server** in the Reactor chapter took a file name in and sent the file's bytes out.
- **Object server** sends objects instead.
- **Byte sequence** records the type, the shape of the fields, and the field values.

:::definition id=def-serialization title="Serialization" source="materials/lectures/Chapter 12 - Serialization.pptx"
Serialization is a representation of an object as a sequence of bytes.

- **Type**, the shape of the fields, and the field values are what the sequence records.
- **Deserialization** builds an object back from that sequence.
- **Primitive fields** and object fields are both preserved.
- **Travel** can be a file or a socket, between machines and between JVMs.
- **Identity** of the original heap object is not in the sequence. Reading produces a new object with the same field values.
:::

`Serializable` is a marker interface with no methods.

- **Flag** is what the JVM checks.
- **Refusal:** `ObjectOutputStream` and `ObjectInputStream` refuse an object whose class does not implement it.

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

Each field is written in its own form.

- **Enum** constant is written by its name.
- **`String`** is written by its characters.
- **`int`** is written by its bits.
- **`readObject`** allocates a new `Pet`.
- **`copy == pet`** is false. `copy.name.equals(pet.name)` is true.

![writeObject saves name and age and skips the hash, which is transient. readObject builds another Pet whose hash starts as null](../../web/public/figures/serialize-object.svg)

### Omitted fields

Some fields never enter the stream.

- **Static** fields belong to the class, and every instance shares them, so the stream omits them.
- **`transient`** fields are omitted as well. A cached hash is the usual case.

```java
private transient Integer hash;
@Override public int hashCode() {
    if (hash == null) hash = compute();
    return hash;
}
```

After deserialization, `hash` is null, and the next `hashCode` computes it again.

- **`transient`** marks a cache, a thread, or a socket: something with no meaning in another JVM.
- **Missing `transient`** on a `Thread` or an `OutputStream` makes `writeObject` throw, because those objects are not `Serializable`.

### serialVersionUID

Changing a class that is already `Serializable` is a compatibility problem: you wrote a file, changed the class, then tried to read the file.

- **`serialVersionUID`** is the version number you assign so the JVM can tell these classes apart.
- **Old stream** stays readable by the new class only when the change is on the compatible list.
- **Compatible changes** keep the old stream readable.
- **Adding a field** brings it back as `null`, `0`, or `false`.
- **Also compatible** are a change of `public` / `protected` / `private`, a new `static` or `transient` field, and a new field order.
- **Incompatible** changes include removing a field that is not `transient`, changing a field's type, and changing the class hierarchy.
- **Mismatch** of `serialVersionUID` fails the read even when the fields would otherwise have matched.

:::problem id=worked-transient-hash title="A transient field" source="materials/lectures/Chapter 12 - Serialization.pptx" kind=worked solution_origin=source
`pet` was serialized after `hashCode` had already filled the cache. What does `hash` contain in the object that `readObject` returns, and what does `name` contain?

```java
public final class Pet implements Serializable {
    public final String name = "A";
    private transient Integer hash;
}
```

:::solution
- **`name`** is `"A"`, because an ordinary object field is part of the stream.
- **`hash`** is null, because `transient` fields are not written and the new object starts from the default.
- **First `hashCode`** on the copy computes the cache again.
- **Identity** differs: the two `Pet` objects are different objects.
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
A field that points at an object that cannot be serialized makes the whole `writeObject` fail, even when you did not mean to send that field.

- **`transient`** keeps that field out of the stream. Restore it after the read.
- **Graph** of a serializable object should not hold a non-serializable object.
:::

:::trap
- **Computed `serialVersionUID`** changes when an edit looks harmless, and old files stop loading.
- **Explicit identifier** belongs on a class that is part of a protocol.
:::

A Reactor protocol can carry these bytes inside a `MessageEncoderDecoder<Serializable>`.

- **Encoder** is an `ObjectOutputStream` on the way out and an `ObjectInputStream` on the way in, framed so the decoder knows when a chunk of the stream has ended.
- **[Persistence](topic:persistence)** is the other way to keep an object.
- **Serialized files** are a poor database. A search for one field has to read every object, an update rewrites the whole graph, and transactions are left to the application.
