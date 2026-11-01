class SharedInt {
  public:
    SharedInt(int value) : _value(new int(value)), _owners(new int(1)) {
    }

    SharedInt(const SharedInt& other) : _value(other._value), _owners(other._owners) {
        (*_owners)++;
    }

    ~SharedInt() {
        leave();
    }

    SharedInt& operator=(const SharedInt& other) {
        if (this != &other) {
            leave();
            _value = other._value;
            _owners = other._owners;
            (*_owners)++;
        }
        return *this;
    }

    int value() const {
        return *_value;
    }

    void setValue(int value) {
        *_value = value;
    }

    int owners() const {
        return *_owners;
    }

  private:
    int* _value;
    int* _owners;

    void leave() {
        (*_owners)--;
        if (*_owners == 0) {
            delete _value;
            delete _owners;
        }
    }
};
