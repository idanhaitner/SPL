def test(name, body):
    try:
        body()
        print("PASS " + name)
    except AssertionError as error:
        print("FAIL " + name + ": " + str(error).replace("\n", " "))
    except Exception as error:
        detail = str(error)
        print("FAIL " + name + ": " + type(error).__name__ + (": " + detail if detail else ""))


def eq(got, want, what):
    if got != want:
        raise AssertionError(f"{what} should be {want!r}, but it is {got!r}")


def is_true(condition, message):
    if not condition:
        raise AssertionError(message)


def raises(error_type, body, message):
    try:
        body()
    except error_type:
        return
    except Exception as error:
        raise AssertionError(f"{message} (it raised {type(error).__name__} instead of {error_type.__name__})")
    raise AssertionError(message + " (nothing was raised)")
