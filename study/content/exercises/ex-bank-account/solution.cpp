#include <string>

class Account {
    const int _id;
    std::string _owner;
    int _balance;

  public:
    Account(int id, const std::string& owner) : _id(id), _owner(owner), _balance(0) {
    }
    int id() const {
        return _id;
    }
    const std::string& owner() const {
        return _owner;
    }
    int balance() const {
        return _balance;
    }
    void deposit(int amount) {
        _balance = _balance + amount;
    }
};
