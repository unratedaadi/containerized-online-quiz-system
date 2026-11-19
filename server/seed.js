const q = (text, options, correct, explanation) => ({
  text,
  options,
  correct,
  explanation,
});
export const seedQuizzes = [
  {
    title: "Web development essentials",
    category: "Computer Science",
    difficulty: "Beginner",
    duration: 10,
    theme: "blue",
    icon: "code",
    description:
      "From the first HTML tag to the browser: explore the building blocks of the web.",
    questions: [
      q(
        "Which language defines the structure of a web page?",
        ["HTML", "CSS", "JavaScript", "SQL"],
        0,
        "HTML gives a page its structure; CSS controls presentation and JavaScript adds behavior.",
      ),
      q(
        "Which CSS property controls the space inside an element’s border?",
        ["margin", "padding", "gap", "outline"],
        1,
        "Padding is inside the border. Margin creates space outside it.",
      ),
      q(
        "Which HTTP method is normally used to retrieve a resource?",
        ["GET", "POST", "PATCH", "DELETE"],
        0,
        "GET retrieves a representation of a resource without changing it.",
      ),
      q(
        "What does the DOM represent?",
        [
          "A database table",
          "A network protocol",
          "The document as a tree of objects",
          "A CSS framework",
        ],
        2,
        "The Document Object Model exposes a document as a tree that scripts can inspect and update.",
      ),
      q(
        "Which HTML element is best for a clickable action?",
        ["<div>", "<span>", "<section>", "<button>"],
        3,
        "A native button provides keyboard interaction, focus handling and the correct semantics.",
      ),
    ],
  },
  {
    title: "Database fundamentals",
    category: "Computer Science",
    difficulty: "Beginner",
    duration: 10,
    theme: "mint",
    icon: "database",
    description:
      "Make sense of tables, relationships and the queries that connect them.",
    questions: [
      q(
        "What uniquely identifies a row in a relational table?",
        ["Primary key", "Foreign key", "Column alias", "View"],
        0,
        "A primary key uniquely identifies each row and cannot contain null values.",
      ),
      q(
        "Which SQL clause filters rows?",
        ["ORDER BY", "WHERE", "GROUP BY", "SELECT"],
        1,
        "WHERE limits the rows returned or affected using a condition.",
      ),
      q(
        "What does a foreign key establish?",
        [
          "A sort order",
          "A backup copy",
          "A relationship between tables",
          "A new database",
        ],
        2,
        "A foreign key references a key in another table, enforcing referential integrity.",
      ),
      q(
        "Which operation reads rows from a table?",
        ["SELECT", "INSERT", "UPDATE", "DROP"],
        0,
        "SELECT queries data. INSERT adds rows, UPDATE changes them, and DROP removes an object.",
      ),
      q(
        "What is the main purpose of a database transaction?",
        [
          "Compress data",
          "Rename tables",
          "Display records",
          "Group operations atomically",
        ],
        3,
        "Transactions commit a set of operations together or roll them back, preserving consistency.",
      ),
    ],
  },
  {
    title: "Computer networks",
    category: "Computer Science",
    difficulty: "Beginner",
    duration: 10,
    theme: "purple",
    icon: "network",
    description:
      "Follow the journey of a packet, from your device to the wider internet.",
    questions: [
      q(
        "What does DNS translate?",
        [
          "Domain names into IP addresses",
          "HTML into CSS",
          "Packets into files",
          "Passwords into hashes",
        ],
        0,
        "The Domain Name System resolves human-readable names to network addresses.",
      ),
      q(
        "Which protocol provides reliable, ordered delivery?",
        ["UDP", "TCP", "IP", "ARP"],
        1,
        "TCP uses sequence numbers, acknowledgements and retransmission to deliver an ordered byte stream.",
      ),
      q(
        "Which device routes packets between networks?",
        ["Monitor", "Keyboard", "Router", "Printer"],
        2,
        "A router forwards packets between networks using destination addresses and routing tables.",
      ),
      q(
        "What does HTTPS add to HTTP?",
        [
          "More image formats",
          "A larger screen",
          "Offline storage",
          "Transport encryption",
        ],
        3,
        "HTTPS uses TLS to encrypt and authenticate the connection.",
      ),
      q(
        "What is a LAN?",
        [
          "Local Area Network",
          "Large Access Node",
          "Linked Address Number",
          "Logical Application Name",
        ],
        0,
        "A Local Area Network connects devices within a limited area such as an office or home.",
      ),
    ],
  },
  {
    title: "The science of everyday life",
    category: "Science",
    difficulty: "Beginner",
    duration: 8,
    theme: "peach",
    icon: "science",
    description:
      "A fresh look at the remarkable science hiding in ordinary things.",
    questions: [
      q(
        "Which organelle produces most cellular ATP?",
        ["Mitochondrion", "Nucleus", "Ribosome", "Golgi apparatus"],
        0,
        "Mitochondria produce most ATP through cellular respiration.",
      ),
      q(
        "At sea level, pure water boils at approximately what temperature?",
        ["50°C", "100°C", "150°C", "200°C"],
        1,
        "At standard atmospheric pressure, pure water boils at approximately 100°C.",
      ),
      q(
        "What force keeps planets in orbit around the Sun?",
        ["Friction", "Magnetism", "Gravity", "Buoyancy"],
        2,
        "Gravity provides the inward acceleration that curves planetary paths around the Sun.",
      ),
      q(
        "Which gas do plants take in during photosynthesis?",
        ["Helium", "Hydrogen", "Nitrogen", "Carbon dioxide"],
        3,
        "Plants use carbon dioxide and water with light energy to synthesize sugars.",
      ),
      q(
        "What is the chemical symbol for gold?",
        ["Au", "Ag", "Fe", "Pb"],
        0,
        "Au comes from the Latin word aurum. Ag is silver, Fe iron and Pb lead.",
      ),
    ],
  },
  {
    title: "A world of knowledge",
    category: "General Knowledge",
    difficulty: "Beginner",
    duration: 8,
    theme: "pink",
    icon: "globe",
    description:
      "Travel through geography, culture and discoveries in five quick questions.",
    questions: [
      q(
        "Which is the largest ocean on Earth?",
        ["Pacific", "Atlantic", "Indian", "Arctic"],
        0,
        "The Pacific Ocean is the largest ocean by surface area.",
      ),
      q(
        "Which city is the capital of Japan?",
        ["Kyoto", "Tokyo", "Osaka", "Nagoya"],
        1,
        "Tokyo is Japan’s capital and its largest metropolitan area.",
      ),
      q(
        "How many sides does a hexagon have?",
        ["Four", "Five", "Six", "Eight"],
        2,
        "A hexagon is a polygon with six sides and six angles.",
      ),
      q(
        "Which instrument measures atmospheric pressure?",
        ["Thermometer", "Anemometer", "Hygrometer", "Barometer"],
        3,
        "A barometer measures atmospheric pressure; the others measure temperature, wind speed and humidity.",
      ),
      q(
        "Who wrote Pride and Prejudice?",
        ["Jane Austen", "Mary Shelley", "Virginia Woolf", "George Eliot"],
        0,
        "Jane Austen’s Pride and Prejudice was first published in 1813.",
      ),
    ],
  },
  {
    title: "Algorithms & problem solving",
    category: "Computer Science",
    difficulty: "Intermediate",
    duration: 12,
    theme: "yellow",
    icon: "puzzle",
    description:
      "Think step by step with sorting, searching and algorithmic complexity.",
    questions: [
      q(
        "What is the time complexity of binary search on a sorted array?",
        ["O(log n)", "O(n)", "O(n²)", "O(1)"],
        0,
        "Each comparison halves the remaining search space, giving logarithmic complexity.",
      ),
      q(
        "Which data structure uses FIFO ordering?",
        ["Stack", "Queue", "Heap", "Tree"],
        1,
        "A queue removes items in the order they were added: First In, First Out.",
      ),
      q(
        "Which sorting algorithm has O(n log n) worst-case time?",
        ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"],
        2,
        "Merge sort splits and merges in logarithmic levels, doing linear work per level.",
      ),
      q(
        "What prevents a recursive function from calling itself forever?",
        ["A loop", "A global variable", "A larger array", "A base case"],
        3,
        "A reachable base case ends recursion without another recursive call.",
      ),
      q(
        "Which approach stores subproblem results for reuse?",
        [
          "Dynamic programming",
          "Linear search",
          "Random sampling",
          "Brute force",
        ],
        0,
        "Dynamic programming reuses solutions to overlapping subproblems instead of recomputing them.",
      ),
    ],
  },
];
