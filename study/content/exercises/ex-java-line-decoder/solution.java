import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

interface MessageEncoderDecoder<T> {
    T decodeNextByte(byte nextByte);

    byte[] encode(T message);
}

class LineDecoder implements MessageEncoderDecoder<String> {
    private final ByteArrayOutputStream pending = new ByteArrayOutputStream();

    public String decodeNextByte(byte nextByte) {
        if (nextByte == '\n') {
            String message = new String(pending.toByteArray(), StandardCharsets.UTF_8);
            pending.reset();
            return message;
        }
        pending.write(nextByte);
        return null;
    }

    public byte[] encode(String message) {
        return (message + "\n").getBytes(StandardCharsets.UTF_8);
    }
}
