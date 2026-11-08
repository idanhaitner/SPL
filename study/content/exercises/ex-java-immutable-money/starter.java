class Money {
    int amount;
    String currency;

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
        this.amount += other.amount;
        return this;
    }
}
