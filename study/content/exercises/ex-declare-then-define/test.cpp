int main() {
    int got = minutesToSeconds(2);
    CHECK("two minutes", got == 120, "2 minutes should be 120 seconds, but minutesToSeconds returned %d", got);

    got = minutesToSeconds(0);
    CHECK("zero minutes", got == 0, "0 minutes should be 0 seconds, but minutesToSeconds returned %d", got);

    got = totalSeconds(2, 5);
    CHECK("total adds the minutes", got == 125, "2 minutes and 5 seconds should be 125 seconds, but totalSeconds returned %d", got);

    got = totalSeconds(0, 45);
    CHECK("no minutes at all", got == 45, "0 minutes and 45 seconds should be 45 seconds, but totalSeconds returned %d", got);
    return 0;
}
