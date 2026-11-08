import java.io.*;

class Temperature implements Serializable {
    private static final long serialVersionUID = 1L;
    final double celsius;
    transient double fahrenheit;

    Temperature(double celsius) {
        this.celsius = celsius;
        this.fahrenheit = celsius * 9 / 5 + 32;
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();
        this.fahrenheit = celsius * 9 / 5 + 32;
    }
}
