int main() {
    int low = 500;
    int high = 500;
    minAndMax(1, 5, 9, low, high);
    CHECK("in order", low == 1 && high == 9, "low should be 1 and high should be 9, but low is %d and high is %d", low, high);

    low = 500;
    high = 500;
    minAndMax(9, 5, 1, low, high);
    CHECK("largest first", low == 1 && high == 9, "low should be 1 and high should be 9, but low is %d and high is %d", low, high);

    low = 500;
    high = 500;
    minAndMax(4, 9, 2, low, high);
    CHECK("largest in the middle", low == 2 && high == 9, "low should be 2 and high should be 9, but low is %d and high is %d", low, high);

    low = 500;
    high = 500;
    minAndMax(-7, -2, -5, low, high);
    CHECK("all negative", low == -7 && high == -2, "low should be -7 and high should be -2, but low is %d and high is %d", low, high);

    low = 500;
    high = 500;
    minAndMax(6, 6, 6, low, high);
    CHECK("all the same", low == 6 && high == 6, "low and high should both be 6, but low is %d and high is %d", low, high);

    low = -100;
    high = 100;
    minAndMax(3, 5, 7, low, high);
    CHECK("old values do not count", low == 3 && high == 7, "low started at -100 and high at 100. After the call low should be 3 and high should be 7, but low is %d and high is %d", low, high);
    return 0;
}
