import type { ExerciseLang } from "@/lib/types";

// Standard-library names the editor suggests, on top of the names written in the file.
export type StdLib = {
  keywords: string[];
  // Classes, type aliases and namespaces.
  types: string[];
  // Free functions and global objects, offered wherever a name can start.
  functions: string[];
  // Methods and fields, offered after . or ->
  members: string[];
  // What can follow #include < (C++) or import / from (Java, Python).
  modules: string[];
};

const words = (s: string) => s.trim().split(/\s+/);

export const STDLIB: Record<ExerciseLang, StdLib> = {
  cpp: {
    keywords: words(`
      auto bool break case catch char class const constexpr const_cast continue decltype default delete do double
      dynamic_cast else enum explicit extern false final float for friend if include inline int long mutable namespace
      new noexcept nullptr operator override private protected public reinterpret_cast return short signed sizeof static
      static_cast struct switch template this throw true try typedef typename union unsigned using virtual void volatile while
      define ifndef ifdef endif pragma once`),
    types: words(`
      std string wstring string_view vector list deque forward_list array map multimap unordered_map set multiset
      unordered_set stack queue priority_queue pair tuple optional variant bitset iterator const_iterator
      reverse_iterator initializer_list unique_ptr shared_ptr weak_ptr function thread mutex recursive_mutex lock_guard
      unique_lock condition_variable atomic future promise ostream istream iostream ofstream ifstream fstream
      stringstream ostringstream istringstream exception runtime_error logic_error invalid_argument out_of_range
      length_error bad_alloc bad_cast size_t ptrdiff_t nullptr_t int8_t int16_t int32_t int64_t uint8_t uint16_t
      uint32_t uint64_t numeric_limits chrono`),
    functions: words(`
      cout cin cerr clog endl flush getline move forward swap make_unique make_shared make_pair make_tuple get tie
      to_string stoi stol stoll stoul stof stod sort stable_sort reverse find find_if find_if_not count count_if
      for_each transform copy copy_if fill fill_n remove remove_if replace unique accumulate min max min_element
      max_element minmax all_of any_of none_of binary_search lower_bound upper_bound equal iota next_permutation
      begin end rbegin rend distance advance next prev back_inserter inserter abs pow sqrt floor ceil round fabs fmod
      exp log log10 sin cos tan printf scanf sprintf snprintf puts malloc calloc realloc free exit abort rand srand
      atoi atof strlen strcpy strncpy strcat strncat strcmp strncmp strchr strstr memcpy memmove memset memcmp
      isalpha isdigit isalnum isspace isupper islower toupper tolower assert setw setprecision fixed boolalpha
      dynamic_pointer_cast static_pointer_cast ref cref bind this_thread`),
    members: words(`
      size length empty clear push_back pop_back emplace_back push_front pop_front emplace_front insert emplace erase
      at front back data begin end cbegin cend rbegin rend resize reserve capacity shrink_to_fit assign swap find
      count contains lower_bound upper_bound equal_range first second top push pop substr append c_str compare rfind
      find_first_of find_last_of find_first_not_of replace starts_with ends_with get reset release use_count lock
      expired unlock try_lock join detach joinable wait notify_one notify_all what str open close is_open good eof
      fail load store has_value value value_or sort reverse unique merge splice remove remove_if`),
    modules: words(`
      iostream string vector list deque array map unordered_map set unordered_set stack queue algorithm memory
      utility functional numeric iterator tuple optional variant bitset fstream sstream iomanip stdexcept exception
      cassert cmath cstdlib cstdio cstring cctype cstdint climits limits thread mutex condition_variable atomic
      future chrono random initializer_list typeinfo`),
  },
  java: {
    keywords: words(`
      abstract assert boolean break byte case catch char class continue default do double else enum extends false
      final finally float for if implements import instanceof int interface long native new null package private
      protected public return short static super switch synchronized this throw throws transient true try var void
      volatile while`),
    types: words(`
      String StringBuilder Object Integer Long Double Float Boolean Character Byte Short Math System Thread Runnable
      Callable Exception RuntimeException IllegalArgumentException IllegalStateException NullPointerException
      IndexOutOfBoundsException InterruptedException IOException UnsupportedOperationException Override
      FunctionalInterface Iterable Iterator Comparable Comparator Collection Collections Arrays Objects Optional
      List ArrayList LinkedList Map HashMap TreeMap LinkedHashMap Set HashSet TreeSet LinkedHashSet Queue Deque
      ArrayDeque PriorityQueue Stack Vector Scanner Random ExecutorService Executors Future CompletableFuture
      TimeUnit CountDownLatch Semaphore BlockingQueue LinkedBlockingQueue ArrayBlockingQueue ConcurrentHashMap
      ConcurrentLinkedQueue CopyOnWriteArrayList AtomicInteger AtomicLong AtomicBoolean AtomicReference Lock
      ReentrantLock ReadWriteLock ReentrantReadWriteLock Condition Function Supplier Consumer Predicate BiFunction
      Stream Collectors Socket ServerSocket BufferedReader BufferedWriter InputStreamReader OutputStreamWriter
      InputStream OutputStream PrintWriter ByteBuffer SocketChannel ServerSocketChannel Selector SelectionKey`),
    functions: [],
    members: words(`
      out err in println print printf length size isEmpty add addAll remove removeIf get set put putIfAbsent
      getOrDefault computeIfAbsent contains containsKey containsValue keySet values entrySet getKey getValue clear
      indexOf iterator hasNext next forEach stream toArray equals hashCode toString compareTo charAt substring
      split trim toLowerCase toUpperCase startsWith endsWith replace format valueOf parseInt parseDouble append
      insert reverse start run join interrupt isInterrupted isAlive sleep currentThread getName wait notify
      notifyAll lock unlock tryLock newCondition await signal signalAll submit execute shutdown shutdownNow
      awaitTermination newFixedThreadPool newCachedThreadPool newSingleThreadExecutor incrementAndGet
      getAndIncrement decrementAndGet getAndDecrement compareAndSet addAndGet offer poll peek take push pop
      countDown acquire release complete isDone map filter collect sorted asList sort max min abs pow sqrt
      random nextInt nextLine readLine write flush close accept getInputStream getOutputStream getMessage
      printStackTrace currentTimeMillis nanoTime`),
    modules: words(`
      java util concurrent atomic locks function stream io nio channels net List ArrayList LinkedList Map HashMap
      Set HashSet Queue Deque Iterator Collections Arrays Scanner ExecutorService Executors TimeUnit AtomicInteger
      ConcurrentHashMap BlockingQueue LinkedBlockingQueue ReentrantLock IOException Socket ServerSocket`),
  },
  python: {
    keywords: words(`
      and as assert async await break class continue def del elif else except False finally for from global if
      import in is lambda None nonlocal not or pass raise return True try while with yield self cls`),
    types: words(`
      str int float bool list dict set tuple frozenset bytes bytearray object type range Exception ValueError
      TypeError KeyError IndexError AttributeError RuntimeError StopIteration NotImplementedError ZeroDivisionError
      FileNotFoundError OSError sqlite3 sys os atexit`),
    functions: words(`
      print len input open isinstance issubclass super enumerate zip map filter sorted reversed sum min max abs
      round any all iter next repr hash id getattr setattr hasattr delattr callable chr ord hex bin divmod pow
      format vars dir staticmethod classmethod property __init__ __str__ __repr__ __eq__ __len__ __name__`),
    members: words(`
      append extend insert remove pop clear index count sort reverse copy keys values items get setdefault update
      add discard union intersection difference join split strip lstrip rstrip lower upper replace startswith
      endswith find format isdigit isalpha encode decode read readline readlines write close connect cursor
      execute executemany executescript fetchone fetchall fetchmany commit rollback lastrowid rowcount
      row_factory register argv exit path exists isfile`),
    modules: words(`sqlite3 sys os atexit math random re json time datetime collections itertools functools typing dataclasses abc threading inspect`),
  },
};
