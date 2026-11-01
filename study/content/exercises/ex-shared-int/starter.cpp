class SharedInt {
  public:
    SharedInt(int value) {
    }

    SharedInt(const SharedInt& other) {
    }

    ~SharedInt() {
    }

    SharedInt& operator=(const SharedInt& other) {
        return *this;
    }

    int value() const {
        return 0;
    }

    void setValue(int value) {
    }

    int owners() const {
        return 0;
    }

  private:
    int* _value;
    int* _owners;
};
