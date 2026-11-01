#include <type_traits>

int main() {
    const Account noa(7, "Noa");
    CHECK("keeps the id", noa.id() == 7, "the account was made with id 7, but id() gives %d", noa.id());
    CHECK("keeps the owner", noa.owner() == "Noa", "the account was made for \"Noa\", but owner() gives \"%s\"", noa.owner().c_str());

    Account* fresh = new Account(2, "Dana");
    int startBalance = fresh->balance();
    delete fresh;
    CHECK("starts at zero", startBalance == 0, "a new account should have a balance of 0, but balance() gives %d", startBalance);

    Account saver(3, "Avi");
    saver.deposit(50);
    saver.deposit(20);
    CHECK("deposits add up", saver.balance() == 70, "after depositing 50 and then 20 the balance should be 70, but balance() gives %d", saver.balance());

    Account first(4, "Rina");
    Account second(5, "Omer");
    first.deposit(10);
    second.deposit(300);
    CHECK("accounts stay separate", first.balance() == 10 && second.balance() == 300, "each account should have its own balance. The first should be 10 and the second 300, but they are %d and %d", first.balance(), second.balance());

    CHECK("id is const", !std::is_copy_assignable<Account>::value, "the id field should be const, so that no later assignment can change it, but this class lets one account be assigned over another");
    return 0;
}
