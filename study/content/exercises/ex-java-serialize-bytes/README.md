---
title: Turn an object into bytes and back
chapter: serialization
order: 1
lang: java
---

Finish the class `Bytes`, two helpers that move an object between memory and a byte array. The byte array is what a program would send over a socket or save in a file.

**Requirements**

- `static byte[] serialize(Object obj)`: write the object into a `ByteArrayOutputStream` through an `ObjectOutputStream`, and return the bytes.
- `static Object deserialize(byte[] data)`: read the object back from those bytes with an `ObjectInputStream` wrapped around a `ByteArrayInputStream`.
- Both methods declare the exceptions they can throw, so the test code can call them.
- A field marked `transient` is not written, so it comes back as its default value (`null`, `0`, `false`).

**Background**

- A class opts in to serialization by writing `implements Serializable`. Serializing an object of any other class throws a `NotSerializableException`.
- `ObjectOutputStream` has `writeObject(obj)`. It buffers, so close the stream (try-with-resources does this) before you call `toByteArray()`.
- `ObjectInputStream` has `readObject()`, which returns an `Object`.

:::example
**Input:** `deserialize(serialize(new Profile("dana", "secret")))`, where `password` is `transient`

**Result:** a `Profile` whose name is `"dana"` and whose password is `null`
:::

:::hint
`try (ObjectOutputStream out = new ObjectOutputStream(bytes)) { out.writeObject(obj); }` writes and closes. Then `return bytes.toByteArray();`.
:::

:::hint
For `deserialize`, `new ObjectInputStream(new ByteArrayInputStream(data))` gives you the stream, and `in.readObject()` the object.
:::

:::case name="a transient field is not written"
The `password` field is `transient`, so it is skipped when the object is written. After reading, it is `null`. This is the whole point of `transient`.
:::

:::case name="a class that is not Serializable"
`Plain` did not write `implements Serializable`. Writing it must fail with a `NotSerializableException`. Do not catch the exception inside `serialize`.
:::
