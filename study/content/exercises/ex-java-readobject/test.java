class Main {
    static Temperature roundTrip(Temperature t) throws Exception {
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        try (java.io.ObjectOutputStream out = new java.io.ObjectOutputStream(bytes)) {
            out.writeObject(t);
        }
        try (java.io.ObjectInputStream in = new java.io.ObjectInputStream(new java.io.ByteArrayInputStream(bytes.toByteArray()))) {
            return (Temperature) in.readObject();
        }
    }

    public static void main(String[] args) {
        Check.test("celsius is kept", () -> {
            Check.eq(roundTrip(new Temperature(37)).celsius, 37.0, "celsius after the round trip");
        });
        Check.test("fahrenheit is rebuilt", () -> {
            Check.eq(roundTrip(new Temperature(100)).fahrenheit, 212.0, "fahrenheit of 100 C after the round trip");
        });
        Check.test("another value", () -> {
            Check.eq(roundTrip(new Temperature(0)).fahrenheit, 32.0, "fahrenheit of 0 C after the round trip");
        });
        Check.test("fahrenheit stays transient", () -> {
            Check.isTrue(java.lang.reflect.Modifier.isTransient(Temperature.class.getDeclaredField("fahrenheit").getModifiers()), "fahrenheit should still be transient");
        });
    }
}
