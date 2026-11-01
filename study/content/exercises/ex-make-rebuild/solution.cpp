int needsRebuild(int targetTime, int firstDependency, int secondDependency) {
    if (firstDependency > targetTime) {
        return 1;
    }
    if (secondDependency > targetTime) {
        return 1;
    }
    return 0;
}
