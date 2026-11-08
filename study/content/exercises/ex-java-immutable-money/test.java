class Main {
    public static void main(String[] args) {
        Check.test("plus adds the amounts", () -> {
            Money sum = new Money(5, "USD").plus(new Money(7, "USD"));
            Check.eq(sum.amount(), 12, "the amount of 5 USD plus 7 USD");
            Check.eq(sum.currency(), "USD", "the currency of the sum");
        });
        Check.test("plus leaves both operands unchanged", () -> {
            Money a = new Money(5, "USD");
            Money b = new Money(7, "USD");
            Money sum = a.plus(b);
            Check.eq(a.amount(), 5, "the left operand after plus");
            Check.eq(b.amount(), 7, "the right operand after plus");
            Check.isTrue(sum != a && sum != b, "plus should return a new object");
        });
        Check.test("class is final", () -> {
            Check.isTrue(java.lang.reflect.Modifier.isFinal(Money.class.getModifiers()), "Money should be declared final");
        });
        Check.test("fields are final", () -> {
            for (java.lang.reflect.Field field : Money.class.getDeclaredFields()) {
                Check.isTrue(java.lang.reflect.Modifier.isFinal(field.getModifiers()), "the field " + field.getName() + " should be final");
            }
        });
        Check.test("plus rejects different currencies", () -> {
            Check.throwsA(IllegalArgumentException.class, () -> new Money(5, "USD").plus(new Money(5, "EUR")), "adding USD and EUR should be rejected");
        });
    }
}
