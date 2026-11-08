---
title: A protocol that decides when to hang up
chapter: reactor
order: 2
lang: java
---

A `MessagingProtocol` decides what each message means. Finish `EchoProtocol`, which repeats what the client says and hangs up when the client says goodbye.

**Requirements**

- `String process(String msg)`: normally reply `"echo: "` followed by the message. If the message is exactly `"bye"`, reply `"goodbye"` and remember that the conversation is over.
- `boolean shouldTerminate()`: false at first. After `"bye"` has been processed it returns true. It already returns the field `terminate`.

**Background**

- The server calls `process` once per message, sends the reply back, and then asks `shouldTerminate()`. When that returns true the server closes the connection.
- The protocol is an object with state: whether the client has said goodbye is something it must remember between calls. That is why it is a class with a field, not a plain function.
- Compare strings with `msg.equals("bye")`, never with `==`.

:::example
**Input:** `process("hi")`, then `process("bye")`

**Result:** `"echo: hi"`, then `"goodbye"`, and now `shouldTerminate()` is true
:::

:::hint
Check for `"bye"` first. In that branch set `terminate = true` and return `"goodbye"`.
:::

:::hint
Every other message falls through to `return "echo: " + msg;`. Do not set `terminate` there.
:::

:::case name="stays open before bye"
`shouldTerminate()` must be false until `"bye"` is processed. A protocol that terminates after the first message would hang up on every client.
:::

:::case name="bye ends the conversation"
After `process("bye")`, `shouldTerminate()` must return true.
:::
