import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Create meta information for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
mongoose.connect("mongodb+srv://user-admin:user-admin@customerservicechat.4uk1s.mongodb.net/?retryWrites=true&w=majority&appName=CustomerServiceChat")
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import Models
// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  }
});

// Class Schema
const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Batch Schema
const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  enrollmentCode: { type: String, required: true, unique: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  language: { type: String, required: true },
  requirements: [String],
  modules: [{
    id: Number,
    title: String,
    learningText: String,
    codeTemplate: String,
    hints: [String],
    expectedOutput: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Student Assignment Schema
const studentAssignmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed'],
    default: 'assigned'
  },
  progress: { type: Number, default: 0 },
  submissions: [{
    moduleId: Number,
    code: String,
    submittedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);
const Batch = mongoose.model('Batch', batchSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const StudentAssignment = mongoose.model('StudentAssignment', studentAssignmentSchema);

// Generate a unique enrollment code
const generateEnrollmentCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Sample data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Class.deleteMany({});
    await Batch.deleteMany({});
    await Assignment.deleteMany({});
    await StudentAssignment.deleteMany({});

    console.log('Existing data cleared');

    // Create teachers
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    
    const teachers = await User.insertMany([
      {
        username: 'prof_alice',
        email: 'alice@example.com',
        password: teacherPassword,
        role: 'teacher'
      },
      {
        username: 'prof_bob',
        email: 'bob@example.com',
        password: teacherPassword,
        role: 'teacher'
      }
    ]);

    console.log('Teachers created:', teachers.map(t => t.username));

    // Create students
    const studentPassword = await bcrypt.hash('student123', 10);
    
    const students = await User.insertMany([
      {
        username: 'student_charlie',
        email: 'charlie@example.com',
        password: studentPassword,
        role: 'student'
      },
      {
        username: 'student_diana',
        email: 'diana@example.com',
        password: studentPassword,
        role: 'student'
      },
      {
        username: 'student_evan',
        email: 'evan@example.com',
        password: studentPassword,
        role: 'student'
      }
    ]);

    console.log('Students created:', students.map(s => s.username));

    // Create classes
    const classes = await Class.insertMany([
      {
        name: 'Introduction to Python',
        subject: 'Programming',
        description: 'Learn the basics of Python programming language',
        teacher: teachers[0]._id
      },
      {
        name: 'Advanced JavaScript',
        subject: 'Web Development',
        description: 'Deep dive into modern JavaScript frameworks and patterns',
        teacher: teachers[0]._id
      },
      {
        name: 'Data Structures',
        subject: 'Computer Science',
        description: 'Fundamental data structures and algorithms',
        teacher: teachers[1]._id
      }
    ]);

    console.log('Classes created:', classes.map(c => c.name));

    // Create batches
    const batches = [];
    for (const classItem of classes) {
      const batch1 = new Batch({
        name: `Morning Batch - ${classItem.name}`,
        class: classItem._id,
        enrollmentCode: generateEnrollmentCode(),
        students: []
      });

      const batch2 = new Batch({
        name: `Evening Batch - ${classItem.name}`,
        class: classItem._id,
        enrollmentCode: generateEnrollmentCode(),
        students: []
      });

      const savedBatch1 = await batch1.save();
      const savedBatch2 = await batch2.save();
      
      batches.push(savedBatch1, savedBatch2);
    }

    console.log('Batches created:', batches.map(b => b.name));
    console.log('Enrollment codes:', batches.map(b => `${b.name}: ${b.enrollmentCode}`));

    // Enroll students in batches
    const batch1 = batches[0];
    const batch2 = batches[1];
    const batch3 = batches[2];

    batch1.students.push(students[0]._id, students[1]._id);
    batch2.students.push(students[1]._id, students[2]._id);
    batch3.students.push(students[0]._id, students[2]._id);

    await batch1.save();
    await batch2.save();
    await batch3.save();

    console.log('Students enrolled in batches');

    // Create assignments
    const pythonAssignment = new Assignment({
  "title": "A* Pathfinding Algorithm Implementation",
  "description": "This interactive tutorial guides you through implementing the A* pathfinding algorithm. You'll start with basic node representation and progressively build each component of the algorithm, culminating in a working pathfinder visualized on a grid.",
  "class": classes[0]._id,
  "language": "Python",
  "requirements": ["numpy"],
  "modules": [
    {
      "id": 1,
      "title": "Module 1: Node Representation",
      "learningText": "A* pathfinding requires tracking multiple values for each location in our search space. Let's start by creating a Node class to store coordinates (x,y), the path cost from start (g), the heuristic estimate to goal (h), the total cost (f), and a reference to its parent node for reconstructing the path later. Fill in the constructor to initialize these values appropriately.",
      "codeTemplate": "class Node:\n    \"\"\"Represents a node in the search space\"\"\"\n    def __init__(self, x, y):\n        <editable>\n        # Initialize the Node with position (x,y):\n        # - x, y coordinates\n        # - g: cost from start to current node (initially infinite)\n        # - h: heuristic estimate to goal (initially 0)\n        # - f: total cost (g + h)\n        # - parent: reference to parent node (initially None)\n        </editable>\n        self.x = x\n        self.y = y\n        self.g = float('inf')  # Cost from start to current node\n        self.h = 0             # Heuristic (estimated cost to goal)\n        self.f = float('inf')  # Total cost (g + h)\n        self.parent = None     # Parent node in the path\n        \n# Test code\ndef main():\n    # Create a test node at position (3, 4)\n    test_node = Node(3, 4)\n    \n    # Print node attributes\n    print(f\"Node position: ({test_node.x}, {test_node.y})\")\n    print(f\"g value: {test_node.g}\")\n    print(f\"h value: {test_node.h}\")\n    print(f\"f value: {test_node.f}\")\n    print(f\"Has parent: {test_node.parent is not None}\")\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "The '__init__' method initializes all the instance variables a Node needs",
        "Set g to float('inf') to represent an infinite initial cost",
        "The parent should be None until we establish connections",
        "Both f and g should start as infinite, while h can start at 0"
      ],
      "expectedOutput": "Node position: (3, 4)\ng value: inf\nh value: 0\nf value: inf\nHas parent: False"
    },
    {
      "id": 2,
      "title": "Module 2: Node Comparison Methods",
      "learningText": "For A* to work efficiently, we need to store nodes in a priority queue sorted by their f-values. Python's heapq module requires objects to be comparable. Let's implement the necessary methods to make Node objects comparable. We'll also need equality comparison for checking if a node has been visited. Remember: in A*, nodes with lower f-values have higher priority!",
      "codeTemplate": "class Node:\n    \"\"\"Represents a node in the search space\"\"\"\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n        self.g = float('inf')  # Cost from start to current node\n        self.h = 0             # Heuristic (estimated cost to goal)\n        self.f = float('inf')  # Total cost (g + h)\n        self.parent = None     # Parent node in the path\n    \n    <editable>\n    # Implement the less than method for priority queue comparisons\n    # Nodes with lower f-values should have higher priority\n    def __lt__(self, other):\n        # Return True if this node's f-value is less than other's f-value\n        pass\n        \n    # Implement the equality method for node comparison\n    # Two nodes are equal if they represent the same position\n    def __eq__(self, other):\n        # Return True if positions match\n        pass\n        \n    # Implement a hash method for using nodes in sets and as dict keys\n    def __hash__(self):\n        # Return a hash of the node's position\n        pass\n    </editable>\n    \n# Test code\ndef main():\n    # Create some test nodes\n    node1 = Node(1, 2)\n    node1.f = 10\n    \n    node2 = Node(3, 4)\n    node2.f = 5\n    \n    node3 = Node(1, 2)  # Same position as node1\n    node3.f = 7\n    \n    # Test comparison\n    print(f\"node2 < node1: {node2 < node1}\")  # Should be True (5 < 10)\n    \n    # Test equality\n    print(f\"node1 == node3: {node1 == node3}\")  # Should be True (same position)\n    print(f\"node1 == node2: {node1 == node2}\")  # Should be False\n    \n    # Test using nodes in a set\n    node_set = set([node1, node2, node3])\n    print(f\"Length of node set: {len(node_set)}\")  # Should be 2, not 3\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "For __lt__, compare the f-values of the two nodes",
        "For __eq__, compare the x and y coordinates",
        "For __hash__, use Python's hash() function on a tuple of (x,y)",
        "When two nodes are at the same position but have different f-values, they're still considered the same node"
      ],
      "expectedOutput": "node2 < node1: True\nnode1 == node3: True\nnode1 == node2: False\nLength of node set: 2"
    },
    {
      "id": 3,
      "title": "Module 3: Heuristic Function Implementation",
      "learningText": "The heuristic function is the 'educated guess' part of A*. It estimates the cost from any node to the goal. A good heuristic never overestimates the true cost. For grid-based pathfinding, we'll use the Euclidean distance (straight-line distance) as our heuristic. Let's implement this function!",
      "codeTemplate": "from math import sqrt\n\nclass AStar:\n    \"\"\"A* pathfinding algorithm implementation\"\"\"\n    def __init__(self, grid):\n        self.grid = grid\n        self.rows = len(grid)\n        self.cols = len(grid[0]) if self.rows > 0 else 0\n    \n    <editable>\n    # Implement the heuristic function\n    # This should calculate the Euclidean distance between two nodes\n    def heuristic(self, node, goal):\n        # Calculate and return the straight-line distance\n        # Formula: sqrt((x2-x1)^2 + (y2-y1)^2)\n        pass\n    </editable>\n\nclass Node:\n    \"\"\"Represents a node in the search space\"\"\"\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n        self.g = float('inf')\n        self.h = 0\n        self.f = float('inf')\n        self.parent = None\n\n# Test code\ndef main():\n    # Create a simple grid\n    grid = [\n        [0, 0, 0],\n        [0, 0, 0],\n        [0, 0, 0]\n    ]\n    \n    # Create A* pathfinder\n    astar = AStar(grid)\n    \n    # Create test nodes\n    start = Node(0, 0)  # Top-left corner\n    middle = Node(1, 1)  # Center\n    goal = Node(2, 2)    # Bottom-right corner\n    \n    # Calculate heuristics\n    h1 = astar.heuristic(start, goal)\n    h2 = astar.heuristic(middle, goal)\n    \n    # Print results\n    print(f\"Heuristic from (0,0) to (2,2): {h1:.2f}\")\n    print(f\"Heuristic from (1,1) to (2,2): {h2:.2f}\")\n    print(f\"Exact Euclidean distances would be {sqrt(8):.2f} and {sqrt(2):.2f}\")\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "Use the Pythagorean theorem: distance = sqrt((x2-x1)^2 + (y2-y1)^2)",
        "Access the x and y coordinates of both nodes",
        "The sqrt() function from the math module is already imported",
        "The heuristic should never overestimate the true cost to the goal"
      ],
      "expectedOutput": "Heuristic from (0,0) to (2,2): 2.83\nHeuristic from (1,1) to (2,2): 1.41\nExact Euclidean distances would be 2.83 and 1.41"
    },
    {
      "id": 4,
      "title": "Module 4: Neighbor Generation",
      "learningText": "In pathfinding, we need to explore all possible next steps from a given node. In a grid, each cell can have up to 8 neighbors (4 cardinal directions plus 4 diagonals). Let's implement a function to find all valid neighbors of a node. Remember to check grid boundaries and avoid obstacles (marked as 1 in our grid)!",
      "codeTemplate": "class AStar:\n    \"\"\"A* pathfinding algorithm implementation\"\"\"\n    def __init__(self, grid):\n        self.grid = grid\n        self.rows = len(grid)\n        self.cols = len(grid[0]) if self.rows > 0 else 0\n    \n    <editable>\n    # Implement the get_neighbors function\n    # This should return a list of all valid neighboring nodes\n    def get_neighbors(self, node):\n        # Initialize empty neighbors list\n        # Check all 8 surrounding cells (including diagonals)\n        # For each neighbor:\n        #   - Check if it's within grid bounds\n        #   - Check if it's traversable (not an obstacle)\n        #   - If valid, create a Node and add to neighbors list\n        pass\n    </editable>\n    \n    def heuristic(self, node, goal):\n        from math import sqrt\n        return sqrt((node.x - goal.x)**2 + (node.y - goal.y)**2)\n\nclass Node:\n    \"\"\"Represents a node in the search space\"\"\"\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n        self.g = float('inf')\n        self.h = 0\n        self.f = float('inf')\n        self.parent = None\n    \n    def __eq__(self, other):\n        return self.x == other.x and self.y == other.y\n\n# Test code\ndef main():\n    # Create a test grid (0 = open space, 1 = obstacle)\n    grid = [\n        [0, 0, 1],\n        [0, 0, 0],\n        [1, 0, 0]\n    ]\n    \n    # Create A* pathfinder\n    astar = AStar(grid)\n    \n    # Test node in the middle (1,1)\n    test_node = Node(1, 1)\n    \n    # Get neighbors\n    neighbors = astar.get_neighbors(test_node)\n    \n    # Sort neighbors by position for consistent output\n    neighbors.sort(key=lambda n: (n.x, n.y))\n    \n    # Print results\n    print(f\"Found {len(neighbors)} neighbors for node at (1,1):\")\n    for n in neighbors:\n        print(f\"  - ({n.x}, {n.y})\")\n    \n    # There should be 7 neighbors (one is blocked by an obstacle)\n    print(f\"Expected 7 neighbors: {'✓' if len(neighbors) == 7 else '✗'}\")\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "Use nested loops to check all 8 surrounding cells",
        "Skip the current node itself (dx=0, dy=0)",
        "Check if the neighbor coordinates are within grid bounds (0 ≤ x < cols, 0 ≤ y < rows)",
        "Check if the neighbor is traversable (grid[y][x] == 0)",
        "Create a new Node object for each valid neighbor"
      ],
      "expectedOutput": "Found 7 neighbors for node at (1,1):\n  - (0, 0)\n  - (0, 1)\n  - (0, 2)\n  - (1, 0)\n  - (1, 2)\n  - (2, 1)\n  - (2, 2)\nExpected 7 neighbors: ✓"
    },
    {
      "id": 5,
      "title": "Module 5: A* Path Finding Algorithm",
      "learningText": "Now it's time to implement the heart of the A* algorithm! We'll use a priority queue (via heapq) to always process the most promising node first. We'll maintain open and closed sets to track which nodes we're considering and which we've already processed. The algorithm continues until we either reach the goal or exhaust all possibilities.",
      "codeTemplate": "import heapq\nfrom math import sqrt\n\nclass Node:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n        self.g = float('inf')\n        self.h = 0\n        self.f = float('inf')\n        self.parent = None\n        \n    def __lt__(self, other):\n        return self.f < other.f\n        \n    def __eq__(self, other):\n        return self.x == other.x and self.y == other.y\n        \n    def __hash__(self):\n        return hash((self.x, self.y))\n\nclass AStar:\n    def __init__(self, grid):\n        self.grid = grid\n        self.rows = len(grid)\n        self.cols = len(grid[0]) if self.rows > 0 else 0\n        \n    def get_neighbors(self, node):\n        neighbors = []\n        for dx in [-1, 0, 1]:\n            for dy in [-1, 0, 1]:\n                if dx == 0 and dy == 0:\n                    continue\n                    \n                nx, ny = node.x + dx, node.y + dy\n                \n                if 0 <= nx < self.cols and 0 <= ny < self.rows:\n                    if self.grid[ny][nx] == 0:\n                        neighbors.append(Node(nx, ny))\n        \n        return neighbors\n    \n    def heuristic(self, node, goal):\n        return sqrt((node.x - goal.x)**2 + (node.y - goal.y)**2)\n    \n    <editable>\n    # Implement the A* pathfinding algorithm\n    def find_path(self, start_pos, goal_pos):\n        # Initialize start and goal nodes\n        # Set up the open and closed sets\n        # Begin the main algorithm loop:\n        #  - Get the node with lowest f score from open set\n        #  - Check if we've reached the goal\n        #  - Add current to closed set\n        #  - Process all neighbors\n        #  - Update path if better one is found\n        # Return the path if found, or None if no path exists\n        pass\n    </editable>\n\n# Test code\ndef main():\n    # Create a simple test grid\n    grid = [\n        [0, 0, 0, 0, 0],\n        [0, 1, 1, 0, 0],\n        [0, 0, 0, 0, 0],\n        [0, 0, 1, 1, 0],\n        [0, 0, 0, 0, 0]\n    ]\n    \n    # Create A* pathfinder\n    astar = AStar(grid)\n    \n    # Define start and goal positions\n    start_pos = (0, 0)  # Top-left corner\n    goal_pos = (4, 4)   # Bottom-right corner\n    \n    # Find path\n    path = astar.find_path(start_pos, goal_pos)\n    \n    # Print results\n    if path:\n        print(f\"Path found from {start_pos} to {goal_pos}:\")\n        for i, step in enumerate(path):\n            print(f\"  Step {i}: {step}\")\n        print(f\"Path length: {len(path)} steps\")\n    else:\n        print(f\"No path found from {start_pos} to {goal_pos}\")\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "Use heapq for the open set to always get the node with lowest f-score",
        "Keep a separate dictionary of nodes for quick lookup and updates",
        "For diagonal movement, use a cost of 1.4 (approximately sqrt(2))",
        "When reconstructing the path, remember to reverse it to get start-to-goal order",
        "Don't forget to handle the case where no path exists"
      ],
      "expectedOutput": "Path found from (0, 0) to (4, 4):\n  Step 0: (0, 0)\n  Step 1: (1, 0)\n  Step 2: (2, 0)\n  Step 3: (3, 0)\n  Step 4: (4, 1)\n  Step 5: (4, 2)\n  Step 6: (4, 3)\n  Step 7: (4, 4)\nPath length: 8 steps"
    },
    {
      "id": 6,
      "title": "Module 6: Path Visualization",
      "learningText": "Let's complete our A* implementation by adding a visualization function. This will help us see the path on the grid, making it easier to understand how A* navigates around obstacles. We'll represent the start as 'S', the goal as 'G', path steps as '*', obstacles as '#', and empty spaces as '.'.",
      "codeTemplate": "import heapq\nfrom math import sqrt\n\n# Previous Node and AStar classes remain the same\nclass Node:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n        self.g = float('inf')\n        self.h = 0\n        self.f = float('inf')\n        self.parent = None\n        \n    def __lt__(self, other):\n        return self.f < other.f\n        \n    def __eq__(self, other):\n        return self.x == other.x and self.y == other.y\n        \n    def __hash__(self):\n        return hash((self.x, self.y))\n\nclass AStar:\n    def __init__(self, grid):\n        self.grid = grid\n        self.rows = len(grid)\n        self.cols = len(grid[0]) if self.rows > 0 else 0\n        \n    def get_neighbors(self, node):\n        neighbors = []\n        for dx in [-1, 0, 1]:\n            for dy in [-1, 0, 1]:\n                if dx == 0 and dy == 0:\n                    continue\n                    \n                nx, ny = node.x + dx, node.y + dy\n                \n                if 0 <= nx < self.cols and 0 <= ny < self.rows:\n                    if self.grid[ny][nx] == 0:\n                        neighbors.append(Node(nx, ny))\n        \n        return neighbors\n    \n    def heuristic(self, node, goal):\n        return sqrt((node.x - goal.x)**2 + (node.y - goal.y)**2)\n    \n    def find_path(self, start_pos, goal_pos):\n        # Initialize start and goal nodes\n        start = Node(start_pos[0], start_pos[1])\n        goal = Node(goal_pos[0], goal_pos[1])\n        \n        # Initialize start node\n        start.g = 0\n        start.h = self.heuristic(start, goal)\n        start.f = start.g + start.h\n        \n        # Initialize open and closed sets\n        open_set = []\n        closed_set = set()\n        \n        # Add start node to open set\n        heapq.heappush(open_set, start)\n        node_dict = {(start.x, start.y): start}\n        \n        while open_set:\n            # Get node with lowest f score\n            current = heapq.heappop(open_set)\n            \n            # Check if goal is reached\n            if current.x == goal.x and current.y == goal.y:\n                # Reconstruct path\n                path = []\n                while current:\n                    path.append((current.x, current.y))\n                    current = current.parent\n                return path[::-1]\n            \n            # Add current node to closed set\n            closed_set.add((current.x, current.y))\n            \n            # Explore neighbors\n            for neighbor in self.get_neighbors(current):\n                # Skip if neighbor is in closed set\n                if (neighbor.x, neighbor.y) in closed_set:\n                    continue\n                \n                # Calculate g score for this path\n                is_diagonal = abs(neighbor.x - current.x) == 1 and abs(neighbor.y - current.y) == 1\n                movement_cost = 1.4 if is_diagonal else 1.0\n                tentative_g = current.g + movement_cost\n                \n                # Check if this neighbor is in open set\n                existing_neighbor = node_dict.get((neighbor.x, neighbor.y))\n                \n                if existing_neighbor is None:\n                    # New node discovered\n                    neighbor.g = tentative_g\n                    neighbor.h = self.heuristic(neighbor, goal)\n                    neighbor.f = neighbor.g + neighbor.h\n                    neighbor.parent = current\n                    \n                    heapq.heappush(open_set, neighbor)\n                    node_dict[(neighbor.x, neighbor.y)] = neighbor\n                elif tentative_g < existing_neighbor.g:\n                    # Better path found\n                    existing_neighbor.g = tentative_g\n                    existing_neighbor.f = existing_neighbor.g + existing_neighbor.h\n                    existing_neighbor.parent = current\n                    \n                    heapq.heapify(open_set)\n        \n        # No path found\n        return None\n    \n    <editable>\n    # Implement the visualize_path function\n    def visualize_path(self, start_pos, goal_pos, path):\n        # Create a visualization of the grid and path\n        # Use these symbols:  \n        #  'S' for start position\n        #  'G' for goal position\n        #  '*' for path steps\n        #  '#' for obstacles (1s in the grid)\n        #  '.' for empty spaces (0s in the grid)\n        # Return a string containing the visualization\n        pass\n    </editable>\n\n# Test code\ndef main():\n    # Create a test grid\n    grid = [\n        [0, 0, 0, 0, 0, 0, 0],\n        [0, 1, 1, 1, 0, 0, 0],\n        [0, 0, 0, 0, 0, 1, 0],\n        [0, 1, 1, 1, 1, 1, 0],\n        [0, 0, 0, 0, 0, 0, 0]\n    ]\n    \n    # Create A* pathfinder\n    astar = AStar(grid)\n    \n    # Define start and goal positions\n    start_pos = (0, 0)\n    goal_pos = (6, 4)\n    \n    # Find path\n    path = astar.find_path(start_pos, goal_pos)\n    \n    # Print results\n    if path:\n        print(f\"Path found from {start_pos} to {goal_pos}:\")\n        for step in path:\n            print(step)\n            \n        # Visualize the path\n        print(\"\\nGrid visualization:\")\n        print(astar.visualize_path(start_pos, goal_pos, path))\n    else:\n        print(f\"No path found from {start_pos} to {goal_pos}\")\n\nif __name__ == \"__main__\":\n    main()\n",
      "hints": [
        "Create a 2D representation of the grid using the specified symbols",
        "Loop through each row and column in the grid",
        "Check special positions (start, goal, path, obstacles) in order of priority",
        "Return the complete grid visualization as a multi-line string",
        "Don't forget to separate rows with newlines"
      ],
      "expectedOutput": "Path found from (0, 0) to (6, 4):\n(0, 0)\n(0, 1)\n(0, 2)\n(0, 3)\n(0, 4)\n(1, 4)\n(2, 4)\n(3, 4)\n(4, 4)\n(5, 4)\n(6, 4)\n\nGrid visualization:\nS . . . . . .\n* # # # . . .\n* . . . . # .\n* # # # # # .\n* * * * * * G"
    }
  ]
});

    const jsAssignment = new Assignment({
      title: 'JavaScript: Async Programming',
      description: 'Learn about Promises and async/await in JavaScript',
      language: "Javascript",
      requirements: ["express"],
      class: classes[1]._id,
      modules: [
        {
          id: 1,
          title: 'Promises',
          learningText: 'Learn how to create and use Promises for async operations',
          codeTemplate: '// Create a promise that resolves after 1 second\nconst myPromise = new Promise((resolve, reject) => {\n    setTimeout(() => {\n        resolve("Success!");\n    }, 1000);\n});\n\n// Use .then to handle the resolved value\nmyPromise.then(result => {\n    console.log(result);\n});',
          hints: ['Remember that Promises take a function with resolve and reject parameters', 'Use .then to handle the resolved value'],
          expectedOutput: 'Success!'
        },
        {
          id: 2,
          title: 'Async/Await',
          learningText: 'Learn how to use async/await syntax for cleaner async code',
          codeTemplate: '// Create a function that returns a promise\nfunction delay(ms) {\n    return new Promise(resolve => setTimeout(resolve, ms));\n}\n\n// Write an async function that uses await\nasync function example() {\n    console.log("Start");\n    await delay(1000);\n    console.log("After 1 second");\n}\n\n// Call the async function\nexample();',
          hints: ['Use the "async" keyword before the function declaration', 'Use "await" before the promise to pause execution'],
          expectedOutput: 'Start\nAfter 1 second'
        }
      ]
    });

    const dataStructuresAssignment = new Assignment({
      title: 'A* Pathfinding Algorithm Implementation',
      description: 'This assignment guides you through implementing the A* pathfinding algorithm',
      class: classes[2]._id,
      language: 'Python',
      requirements: ['numpy'],
      modules: [
        {
          id: 1,
          title: 'Graph Representation',
          learningText: 'Learn how to represent a graph for pathfinding',
          codeTemplate: 'class Graph:\n    def __init__(self):\n        self.nodes = {}\n\n    def add_node(self, name, coordinates):\n        self.nodes[name] = {\'coordinates\': coordinates, \'neighbors\': []}\n\n    def add_edge(self, node1, node2):\n        # Your code here\n        pass',
          hints: ['Remember to update the neighbors lists for both nodes', 'Check if the nodes exist before adding edges'],
          expectedOutput: 'Graph with nodes and edges properly connected'
        },
        {
          id: 2,
          title: 'Heuristic Function',
          learningText: 'Implement the Manhattan distance heuristic',
          codeTemplate: 'def manhattan_distance(node1_coords, node2_coords):\n    # Your code here\n    pass',
          hints: ['Calculate the sum of absolute differences in x and y coordinates', 'Use the abs() function'],
          expectedOutput: 'Manhattan distance between coordinates'
        }
      ]
    });

    const savedAssignments = await Assignment.insertMany([
      pythonAssignment, 
      jsAssignment, 
      dataStructuresAssignment
    ]);

    console.log('Assignments created:', savedAssignments.map(a => a.title));

    // Create student assignments
    const studentAssignmentPromises = [];

    // For Python class
    const pythonClassStudents = [...new Set([...batch1.students])];
    for (const studentId of pythonClassStudents) {
      studentAssignmentPromises.push(
        new StudentAssignment({
          student: studentId,
          assignment: pythonAssignment._id,
          status: 'assigned'
        }).save()
      );
    }

    // For JS class
    const jsClassStudents = [...new Set([...batch2.students])];
    for (const studentId of jsClassStudents) {
      studentAssignmentPromises.push(
        new StudentAssignment({
          student: studentId,
          assignment: jsAssignment._id,
          status: 'assigned'
        }).save()
      );
    }

    // For Data Structures class
    const dsClassStudents = [...new Set([...batch3.students])];
    for (const studentId of dsClassStudents) {
      studentAssignmentPromises.push(
        new StudentAssignment({
          student: studentId,
          assignment: dataStructuresAssignment._id,
          status: 'assigned'
        }).save()
      );
    }

    await Promise.all(studentAssignmentPromises);
    console.log('Student assignments created');

    // Add some example submissions for student 1
    const studentAssignment = await StudentAssignment.findOne({
      student: students[0]._id,
      assignment: pythonAssignment._id
    });

    if (studentAssignment) {
      studentAssignment.status = 'in-progress';
      studentAssignment.progress = 50;
      studentAssignment.submissions.push({
        moduleId: 1,
        code: 'x = 10\n\nif x > 5:\n    print("x is greater than 5")',
        submittedAt: new Date()
      });
      await studentAssignment.save();
      console.log('Example submission added for student_charlie');
    }

    console.log('Database seeded successfully!');
    console.log('\nTEST ACCOUNTS:');
    console.log('Teacher Accounts:');
    console.log('- Email: alice@example.com, Password: teacher123');
    console.log('- Email: bob@example.com, Password: teacher123');
    console.log('\nStudent Accounts:');
    console.log('- Email: charlie@example.com, Password: student123');
    console.log('- Email: diana@example.com, Password: student123');
    console.log('- Email: evan@example.com, Password: student123');
    console.log('\nBatch Enrollment Codes:');
    batches.forEach(batch => {
      console.log(`- ${batch.name}: ${batch.enrollmentCode}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();