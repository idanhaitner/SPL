#include <string>

class Account {
    std::string _owner;

  public:
    Account(int id, const std::string& owner) {
    }
    int id() const {
        return 0;
    }
    const std::string& owner() const {
        return _owner;
    }
    int balance() const {
        return 0;
    }
    void deposit(int amount) {
    }
};
