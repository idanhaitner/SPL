final class Money {
    private final int amount;
    private final String currency;

    Money(int amount, String currency) {
        this.amount = amount;
        this.currency = currency;
    }

    int amount() {
        return amount;
    }

    String currency() {
        return currency;
    }

    Money plus(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("different currencies");
        }
        return new Money(amount + other.amount, currency);
    }
}
