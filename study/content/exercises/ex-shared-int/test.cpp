int main() {
    SharedInt first(5);
    CHECK("a new one has one owner", first.owners() == 1 && first.value() == 5, "SharedInt(5) should have 1 owner and the value 5, but it has %d owners and the value %d", first.owners(), first.value());

    {
        SharedInt second(first);
        CHECK("a copy adds an owner", first.owners() == 2 && second.owners() == 2, "after a copy, both should report 2 owners, but they report %d and %d", first.owners(), second.owners());

        second.setValue(8);
        CHECK("a copy shares the value", first.value() == 8 && second.value() == 8, "changing the value through the copy should show through both, as 8, but they hold %d and %d", first.value(), second.value());
    }
    CHECK("destroying a copy drops the count", first.owners() == 1 && first.value() == 8, "when the copy is destroyed, the original should report 1 owner and still hold 8, but it reports %d owners and holds %d", first.owners(), first.value());

    SharedInt a(1);
    SharedInt b(2);
    SharedInt c = a;
    a = b;
    CHECK("assignment leaves the old and joins the new", a.owners() == 2 && b.owners() == 2 && c.owners() == 1, "after c = a and a = b, a and b should report 2 owners and c should report 1, but they report %d, %d, and %d", a.owners(), b.owners(), c.owners());
    CHECK("assignment reads the new value", a.value() == 2 && c.value() == 1, "after a = b, a should read 2 and c should still read 1, but they read %d and %d", a.value(), c.value());

    c = b;
    CHECK("assigning away the last owner", c.owners() == 3 && c.value() == 2, "c was the last owner of its old value, and after c = b it should report 3 owners and read 2, but it reports %d and reads %d", c.owners(), c.value());

    SharedInt x(1);
    SharedInt y(2);
    SharedInt z(3);
    x = y = z;
    CHECK("chained assignment", x.owners() == 3 && x.value() == 3 && y.value() == 3, "after x = y = z, all three should report 3 owners and read 3, but x reports %d owners and reads %d", x.owners(), x.value());

    SharedInt solo(4);
    SharedInt& sameObject = solo;
    solo = sameObject;
    CHECK("self-assignment changes nothing", solo.owners() == 1 && solo.value() == 4, "assigning an object to itself should keep 1 owner and the value 4, but it reports %d owners and reads %d", solo.owners(), solo.value());
    return 0;
}
