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
        return new byte[0];
    }

    String decodeNextByte(byte nextByte) {
        return null;
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
        return new ArrayList<>();
    }
}
