import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

interface MessageEncoderDecoder<T> {
    T decodeNextByte(byte nextByte);

    byte[] encode(T message);
}

class LineDecoder implements MessageEncoderDecoder<String> {
    private final ByteArrayOutputStream pending = new ByteArrayOutputStream();

    public String decodeNextByte(byte nextByte) {
        return null;
    }

    public byte[] encode(String message) {
        return new byte[0];
    }
}
