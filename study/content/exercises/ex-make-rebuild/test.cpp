int main() {
    int got = needsRebuild(50, 30, 40);
    CHECK("everything up to date", got == 0, "both dependencies are older than the target, so the answer should be 0, but needsRebuild returned %d", got);

    got = needsRebuild(50, 70, 40);
    CHECK("first dependency is newer", got == 1, "the first dependency is newer than the target, so the answer should be 1, but needsRebuild returned %d", got);

    got = needsRebuild(50, 30, 70);
    CHECK("second dependency is newer", got == 1, "the second dependency is newer than the target, so the answer should be 1, but needsRebuild returned %d", got);

    got = needsRebuild(0, 30, 40);
    CHECK("target is missing", got == 1, "a target with the time 0 does not exist yet, so the answer should be 1, but needsRebuild returned %d", got);

    got = needsRebuild(50, 50, 50);
    CHECK("same time is not newer", got == 0, "a dependency with the same time as the target is not newer, so the answer should be 0, but needsRebuild returned %d", got);
    return 0;
}
