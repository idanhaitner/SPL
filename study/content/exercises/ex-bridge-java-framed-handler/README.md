---
title: From bytes to replies
chapter: bridge-servers
order: 1
lang: java
---

Build the path one client's bytes take through a server: a decoder that finds length-prefixed messages, and a handler that passes each message to the protocol and collects the replies.

`CounterProtocol` is already written. It understands `add N`, `get`, and `bye`.

**Requirements**

- A message on the wire is one length byte *n* (0 to 127), followed by *n* bytes of UTF-8 text.
- `byte[] encode(String message)` in `FrameCodec`: returns the length byte followed by the message's bytes.
- `String decodeNextByte(byte nextByte)` in `FrameCodec`: called once for every byte. It returns `null` while a message is incomplete, and the message as soon as its last byte arrives. A message of length 0 is complete as soon as its length byte arrives, and is the empty string. After returning a message, the codec is ready for the next one.
- `List<String> feed(byte[] chunk)` in `Handler`: one read's worth of bytes. It feeds every byte to the codec. Each complete message goes to `protocol.process`, and each reply that is not `null` is added to the list that `feed` returns. Once `protocol.shouldTerminate()` is true, the rest of the bytes are ignored, in this chunk and in later ones.

**Background**

- TCP delivers a stream. A chunk can end in the middle of a message, and it can hold several messages, so the codec keeps its place in its fields between calls.
- The codec handles framing and encoding. The protocol handles meaning. The handler connects them, and belongs to one client.
- `new String(bytes, 0, count, StandardCharsets.UTF_8)` turns the first `count` bytes of an array into text, and `message.getBytes(StandardCharsets.UTF_8)` goes the other way.

:::example
**Input:** `feed` is called with the bytes of `add 5` and `get`, each after its length byte, in one chunk.

**Result:** a list holding `"5"`. `add 5` has no reply, and `get` replies with the count.
:::

:::hint
The codec is in one of two states: waiting for a length byte (`expected` is -1), or collecting text. In the first state, the byte you get is the length.
:::

:::hint
Check for a complete message in both states. Right after reading a length of 0, the message is already complete.
:::

:::hint
In `feed`, test `protocol.shouldTerminate()` at the top of the loop over the bytes, so that it also stops a later chunk.
:::
