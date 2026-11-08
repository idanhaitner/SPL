---
title: Rebuild a transient field in readObject
chapter: serialization
order: 2
lang: java
---

A value that is cheap to recompute does not need to be stored. The class `Temperature` keeps only `celsius` in the stream and marks `fahrenheit` as `transient`. Reading the object back would leave `fahrenheit` at 0.0, so finish the `readObject` method that restores it.

**Requirements**

- `readObject(ObjectInputStream in)` runs while an object is being read. Call `in.defaultReadObject()` first, which reads the normal (non-transient) fields.
- Then set `fahrenheit` to `celsius * 9 / 5 + 32`.
- Do not change the constructor or the fields.

**Background**

- `private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException` is a hook that the serialization machinery looks for by name and signature. You never call it yourself.
- No constructor runs when an object is read from a stream. That is why a transient field comes back as a default value unless `readObject` rebuilds it.
- Water boils at 100 degrees Celsius, which is 212 degrees Fahrenheit.

:::example
**Input:** write `new Temperature(100)` to bytes and read it back

**Result:** `celsius` is 100.0 and `fahrenheit` is 212.0
:::

:::hint
The method has two lines: `in.defaultReadObject();` and then the assignment to `fahrenheit`.
:::

:::hint
If `fahrenheit` still reads 0.0 after the round trip, `readObject` is not setting it. Check that you assign to the field, not to a new local variable.
:::

:::case name="fahrenheit is rebuilt"
The `fahrenheit` field was not written, so after reading it is 0.0 until `readObject` sets it from `celsius`.
:::

:::case name="celsius is kept"
`defaultReadObject()` is what restores `celsius`. Without that call, `celsius` is 0.0 too.
:::
