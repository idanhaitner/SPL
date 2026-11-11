int* makeLedger(int n) {
    int* ledger = new int[n];
    for (int i = 0; i < n; i++) {
        ledger[i] = 0;
    }
    return ledger;
}

void deposit(int* ledger, int n, int index, int amount) {
    if (index < 0 || index >= n) {
        return;
    }
    ledger[index] = ledger[index] + amount;
}

int total(const int* ledger, int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum = sum + ledger[i];
    }
    return sum;
}

void closeLedger(int*& ledger) {
    delete[] ledger;
    ledger = nullptr;
}
