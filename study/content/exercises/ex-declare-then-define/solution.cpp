int minutesToSeconds(int minutes);

int totalSeconds(int minutes, int seconds) {
    return minutesToSeconds(minutes) + seconds;
}

int minutesToSeconds(int minutes) {
    return minutes * 60;
}
