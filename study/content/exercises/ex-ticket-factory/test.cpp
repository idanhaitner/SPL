#include <type_traits>

int main() {
    bool outsidersCanBuild = std::is_constructible<Ticket, int>::value;
    CHECK("constructor is private", !outsidersCanBuild, "code outside the class should not be able to call the constructor, but Ticket(5) is allowed");

    Ticket* twelve = Ticket::create(12);
    int twelveSeat = twelve != nullptr ? twelve->seat() : -1;
    CHECK("keeps the seat", twelveSeat == 12, "create(12) should give a ticket for seat 12, but the seat is %d (-1 means create gave nullptr)", twelveSeat);
    delete twelve;

    Ticket* one = Ticket::create(1);
    int oneSeat = one != nullptr ? one->seat() : -1;
    CHECK("seat 1 is allowed", oneSeat == 1, "seat numbers start at 1, so create(1) should give a ticket for seat 1, but the seat is %d (-1 means create gave nullptr)", oneSeat);
    delete one;

    Ticket* zero = Ticket::create(0);
    CHECK("seat 0 is refused", zero == nullptr, "create(0) should give nullptr, but it gave a ticket");
    delete zero;

    Ticket* negative = Ticket::create(-3);
    CHECK("a negative seat is refused", negative == nullptr, "create(-3) should give nullptr, but it gave a ticket");
    delete negative;

    Ticket* first = Ticket::create(4);
    Ticket* second = Ticket::create(9);
    bool different = first != nullptr && second != nullptr && first != second;
    CHECK("each call makes a new ticket", different, "two calls to create should give two different addresses, but they did not");
    int firstSeat = first != nullptr ? first->seat() : -1;
    int secondSeat = second != nullptr ? second->seat() : -1;
    CHECK("tickets keep their own seats", firstSeat == 4 && secondSeat == 9, "the tickets should be for seats 4 and 9, but they are for seats %d and %d (-1 means create gave nullptr)", firstSeat, secondSeat);
    delete first;
    if (second != first) {
        delete second;
    }
    return 0;
}
