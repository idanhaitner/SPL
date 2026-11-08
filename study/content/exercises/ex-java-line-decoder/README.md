---
title: Find where a message ends
chapter: reactor
order: 1
lang: java
---

TCP delivers a stream of bytes with no message boundaries. A `MessageEncoderDecoder` is the part of a server that finds them. Finish `LineDecoder`, whose messages end with the byte `'\n'`.

**Requirements**

- `String decodeNextByte(byte nextByte)`: the server calls this once for every byte that arrives. While a message is still incomplete, return `null`. When `nextByte` is `'\n'`, return the message collected so far (without the newline) as a UTF-8 `String`, and start the next message empty.
- `byte[] encode(String message)`: return the message followed by `'\n'`, as UTF-8 bytes.
- Keep the bytes collected so far in the field `pending`.

**Background**

- A single `send` may arrive in pieces, and two messages may arrive glued together. Reading one byte at a time and asking "did that finish a message?" works however the bytes are split.
- `pending.write(b)` adds a byte, `pending.toByteArray()` returns what was collected, and `pending.reset()` empties it.
- `new String(bytes, StandardCharsets.UTF_8)` turns bytes into text, and `text.getBytes(StandardCharsets.UTF_8)` turns text into bytes.

:::example
**Input:** the bytes `h`, `i`, `\n`

**Result:** `null`, `null`, then `"hi"`
:::

:::hint
Test for the end first: `if (nextByte == '\n')`. Everything else is stored with `pending.write(nextByte)` and answered with `null`.
:::

:::hint
Do not forget `pending.reset()` before you return the message. Otherwise the second message would start with the text of the first.
:::

:::case name="the second message starts empty"
After one message is returned, `pending` must be reset. A second line should contain only its own text.
:::

:::case name="an empty line"
Two newlines in a row are an empty message. `decodeNextByte` should return `""`, not `null`.
:::
