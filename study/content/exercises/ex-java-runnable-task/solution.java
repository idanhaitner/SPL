class SumTask implements Runnable {
    private final int n;
    private final long[] result;

    SumTask(int n, long[] result) {
        this.n = n;
        this.result = result;
    }

    @Override
    public void run() {
        long total = 0;
        for (int i = 1; i <= n; i++) {
            total += i;
        }
        result[0] = total;
    }
}
