class Profile implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    final String name;
    final transient String password;

    Profile(String name, String password) {
        this.name = name;
        this.password = password;
    }
}

class Plain {
    int x = 1;
}

class Main {
    public static void main(String[] args) {
        Check.test("bytes come out", () -> {
            byte[] data = Bytes.serialize("hello");
            Check.isTrue(data.length > 0, "serialize should return some bytes");
        });
        Check.test("a string survives the round trip", () -> {
            Object back = Bytes.deserialize(Bytes.serialize("hello"));
            Check.eq(back, "hello", "the string read back");
        });
        Check.test("a transient field is not written", () -> {
            Profile back = (Profile) Bytes.deserialize(Bytes.serialize(new Profile("dana", "secret")));
            Check.eq(back.name, "dana", "the name");
            Check.eq(back.password, null, "the transient password");
        });
        Check.test("a class that is not Serializable", () -> {
            Check.throwsA(java.io.NotSerializableException.class, () -> Bytes.serialize(new Plain()), "serializing a Plain should fail");
        });
    }
}
