import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

class CounterProtocol {
    private int count = 0;
    private boolean terminate = false;

    String process(String msg) {
        if (msg.equals("bye")) {
            terminate = true;
            return "goodbye";
        }
        if (msg.equals("get")) {
            return String.valueOf(count);
        }
        if (msg.startsWith("add ")) {
            count = count + Integer.parseInt(msg.substring(4));
        }
        return null;
    }

    boolean shouldTerminate() {
        return terminate;
    }
}

class FrameCodec {
    private int expected = -1;
    private byte[] pending = new byte[127];
    private int count = 0;

    byte[] encode(String message) {
        byte[] text = message.getBytes(StandardCharsets.UTF_8);
        byte[] framed = new byte[text.length + 1];
        framed[0] = (byte) text.length;
        for (int i = 0; i < text.length; i++) {
            framed[i + 1] = text[i];
        }
        return framed;
    }

    String decodeNextByte(byte nextByte) {
        if (expected < 0) {
            expected = nextByte;
        } else {
            pending[count] = nextByte;
            count = count + 1;
        }
        if (count < expected) {
            return null;
        }
        String message = new String(pending, 0, count, StandardCharsets.UTF_8);
        expected = -1;
        count = 0;
        return message;
    }
}

class Handler {
    private final FrameCodec codec;
    private final CounterProtocol protocol;

    Handler(FrameCodec codec, CounterProtocol protocol) {
        this.codec = codec;
        this.protocol = protocol;
    }

    List<String> feed(byte[] chunk) {
        List<String> replies = new ArrayList<>();
        for (byte next : chunk) {
            if (protocol.shouldTerminate()) {
                break;
            }
            String message = codec.decodeNextByte(next);
            if (message != null) {
                String reply = protocol.process(message);
                if (reply != null) {
                    replies.add(reply);
                }
            }
        }
        return replies;
    }
}
