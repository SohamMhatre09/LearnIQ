import requests
import time
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_create_advanced_python_assignment():
    """Test creating a new advanced Python assignment with LangChain and ML libraries"""
    print("\n=== Testing Create Advanced Python Assignment ===")
    
    assignment_data = {
        "assignment_name": "advanced_python_assignment",
        "language": "python",
        "requirements": [
            "langchain==0.1.5", 
            "openai==1.3.0", 
            "scikit-learn==1.3.2", 
            "tensorflow>=2.16.0",  # Updated to use latest available TensorFlow version
            "transformers==4.37.0",
            "torch==2.1.2"
        ]
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_create_advanced_js_assignment():
    """Test creating a new advanced JavaScript assignment with complex libraries"""
    print("\n=== Testing Create Advanced JavaScript Assignment ===")
    
    assignment_data = {
        "assignment_name": "advanced_js_assignment",
        "language": "javascript",
        "requirements": [
            "@tensorflow/tfjs", 
            "d3",
            "three", 
            "react", 
            "redux",
            "express"
        ]
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_create_advanced_cpp_assignment():
    """Test creating a new advanced C++ assignment"""
    print("\n=== Testing Create Advanced C++ Assignment ===")
    
    assignment_data = {
        "assignment_name": "advanced_cpp_assignment",
        "language": "cpp",
        "requirements": []  # Using standard libraries for C++
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_execute_langchain_code(assignment_name):
    """Test executing complex Python code with LangChain"""
    print("\n=== Testing Execute LangChain Python Code ===")
    
    code_content = """
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import OpenAI
import os

# Mock OpenAI for testing purposes without API key
class MockOpenAI:
    def invoke(self, prompt):
        return f"This is a simulated response for: {prompt}"

# Create a prompt template
template = \"""
You are a helpful assistant that generates examples for programming languages.
Please provide a simple example in {language}.
\"""

prompt = PromptTemplate(
    input_variables=["language"],
    template=template,
)

# Create a chain with our mock
mock_llm = MockOpenAI()

# Create the chain
chain = LLMChain(llm=mock_llm, prompt=prompt)

# Run the chain
result = chain.invoke({"language": "Python"})
print("LangChain Template System Result:")
print(result)

# Additionally, demonstrate some ML capabilities with scikit-learn
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Generate a synthetic dataset
X, y = make_classification(
    n_samples=1000, 
    n_features=20,
    n_informative=10,
    n_classes=2,
    random_state=42
)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a model
model = RandomForestClassifier(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, predictions)
print(f"\\nMachine Learning Model Results:")
print(f"Model: Random Forest Classifier")
print(f"Accuracy: {accuracy:.4f}")
print("\\nFeature Importances (Top 5):")
importances = model.feature_importances_
indices = importances.argsort()[::-1]
for i in range(5):
    print(f"Feature {indices[i]}: {importances[indices[i]]:.4f}")
"""
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": code_content
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_advanced_js_code(assignment_name):
    """Test executing complex JavaScript code with async operations and algorithms"""
    print("\n=== Testing Execute Advanced JavaScript Code ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
// Advanced JavaScript with async/await, promises, and complex algorithms
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

// Complex data structure
class Graph {
    constructor() {
        this.nodes = new Map();
    }
    
    addNode(node) {
        this.nodes.set(node, []);
    }
    
    addEdge(source, destination) {
        if (!this.nodes.has(source)) this.addNode(source);
        if (!this.nodes.has(destination)) this.addNode(destination);
        
        this.nodes.get(source).push(destination);
    }
    
    // Breadth-First Search
    async bfs(startNode) {
        const visited = new Set();
        const queue = [startNode];
        const result = [];
        
        visited.add(startNode);
        
        while (queue.length > 0) {
            const currentNode = queue.shift();
            result.push(currentNode);
            
            // Simulate some async work
            await setTimeoutPromise(10);
            
            for (const neighbor of this.nodes.get(currentNode)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return result;
    }
    
    // Depth-First Search
    dfs(startNode) {
        const visited = new Set();
        const result = [];
        
        const dfsHelper = (node) => {
            visited.add(node);
            result.push(node);
            
            for (const neighbor of this.nodes.get(node)) {
                if (!visited.has(neighbor)) {
                    dfsHelper(neighbor);
                }
            }
        };
        
        dfsHelper(startNode);
        return result;
    }
}

// Create a complex graph
const graph = new Graph();
const vertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

for (const vertex of vertices) {
    graph.addNode(vertex);
}

graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('B', 'E');
graph.addEdge('C', 'F');
graph.addEdge('C', 'G');
graph.addEdge('E', 'F');

// Execute complex async operations
async function performComplexOperations() {
    console.log('Graph created with vertices:', vertices);
    console.log('Running DFS...');
    const dfsResult = graph.dfs('A');
    console.log('DFS traversal result:', dfsResult);
    
    console.log('Running BFS (async)...');
    const bfsResult = await graph.bfs('A');
    console.log('BFS traversal result:', bfsResult);
    
    // Simulating parallel async operations with Promise.all
    console.log('\\nRunning multiple async operations in parallel...');
    const start = Date.now();
    
    const tasks = [
        setTimeoutPromise(100).then(() => 'Task 1 completed'),
        setTimeoutPromise(50).then(() => 'Task 2 completed'),
        setTimeoutPromise(150).then(() => 'Task 3 completed')
    ];
    
    const results = await Promise.all(tasks);
    console.log(`Parallel tasks completed in ${Date.now() - start}ms:`, results);
    
    // Implement a more complex algorithm: quicksort
    console.log('\\nImplementing quicksort algorithm...');
    
    function quickSort(arr) {
        if (arr.length <= 1) return arr;
        
        const pivot = arr[Math.floor(arr.length / 2)];
        const less = arr.filter(x => x < pivot);
        const equal = arr.filter(x => x === pivot);
        const greater = arr.filter(x => x > pivot);
        
        return [...quickSort(less), ...equal, ...quickSort(greater)];
    }
    
    const unsortedArray = [9, 3, 7, 4, 1, 2, 8, 5, 6];
    console.log('Unsorted array:', unsortedArray);
    const sortedArray = quickSort(unsortedArray);
    console.log('Sorted array:', sortedArray);
}

// Execute our complex function
performComplexOperations()
    .then(() => console.log('All operations completed successfully!'))
    .catch(err => console.error('Error in async operations:', err));
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_advanced_cpp_code(assignment_name):
    """Test executing advanced C++ code with complex algorithms"""
    print("\n=== Testing Execute Advanced C++ Code ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
#include <map>
#include <set>
#include <string>
#include <chrono>
#include <random>
#include <functional>
#include <memory>
#include <thread>
#include <mutex>
#include <future>

// Template for generic graph implementation
template<typename T>
class Graph {
private:
    std::map<T, std::vector<std::pair<T, int>>> adjList; // Node -> [(Neighbor, Weight)]

public:
    void addEdge(T from, T to, int weight = 1) {
        adjList[from].push_back({to, weight});
        // Ensure the 'to' node exists in the map even if it has no outgoing edges
        if (adjList.find(to) == adjList.end()) {
            adjList[to] = {};
        }
    }

    std::vector<T> getNodes() const {
        std::vector<T> nodes;
        for (const auto& pair : adjList) {
            nodes.push_back(pair.first);
        }
        return nodes;
    }

    // Dijkstra's shortest path algorithm
    std::map<T, int> dijkstra(T start) {
        std::map<T, int> distances;
        // Initialize all distances to infinity
        for (const auto& pair : adjList) {
            distances[pair.first] = std::numeric_limits<int>::max();
        }
        distances[start] = 0;

        // Priority queue for Dijkstra's algorithm
        std::priority_queue<std::pair<int, T>, 
                          std::vector<std::pair<int, T>>, 
                          std::greater<std::pair<int, T>>> pq;
        pq.push({0, start});

        while (!pq.empty()) {
            auto [dist, current] = pq.top();
            pq.pop();

            // If we already found a better path, skip
            if (dist > distances[current]) continue;

            // Check all neighbors
            for (const auto& [neighbor, weight] : adjList[current]) {
                int newDist = dist + weight;
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    pq.push({newDist, neighbor});
                }
            }
        }
        return distances;
    }

    // A* search algorithm (simplified)
    std::vector<T> astar(T start, T goal, std::function<int(T, T)> heuristic) {
        std::set<T> closedSet;
        std::set<T> openSet{start};
        std::map<T, T> cameFrom;
        
        std::map<T, int> gScore;
        for (const auto& pair : adjList) {
            gScore[pair.first] = std::numeric_limits<int>::max();
        }
        gScore[start] = 0;
        
        std::map<T, int> fScore;
        for (const auto& pair : adjList) {
            fScore[pair.first] = std::numeric_limits<int>::max();
        }
        fScore[start] = heuristic(start, goal);
        
        while (!openSet.empty()) {
            // Find node with lowest fScore
            T current = *openSet.begin();
            for (const T& node : openSet) {
                if (fScore[node] < fScore[current]) {
                    current = node;
                }
            }
            
            if (current == goal) {
                // Reconstruct path
                std::vector<T> path;
                while (cameFrom.find(current) != cameFrom.end()) {
                    path.push_back(current);
                    current = cameFrom[current];
                }
                path.push_back(start);
                std::reverse(path.begin(), path.end());
                return path;
            }
            
            openSet.erase(current);
            closedSet.insert(current);
            
            for (const auto& [neighbor, weight] : adjList[current]) {
                if (closedSet.find(neighbor) != closedSet.end()) {
                    continue;
                }
                
                int tentative_gScore = gScore[current] + weight;
                
                if (openSet.find(neighbor) == openSet.end()) {
                    openSet.insert(neighbor);
                } else if (tentative_gScore >= gScore[neighbor]) {
                    continue;
                }
                
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentative_gScore;
                fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal);
            }
        }
        
        // No path found
        return {};
    }
};

// Quick Sort implementation
template<typename T>
void quickSort(std::vector<T>& arr, int low, int high) {
    if (low < high) {
        // Partition the array
        T pivot = arr[high];
        int i = low - 1;
        
        for (int j = low; j <= high - 1; j++) {
            if (arr[j] < pivot) {
                i++;
                std::swap(arr[i], arr[j]);
            }
        }
        std::swap(arr[i + 1], arr[high]);
        int partition = i + 1;
        
        // Recursively sort elements
        quickSort(arr, low, partition - 1);
        quickSort(arr, partition + 1, high);
    }
}

// Multithreaded merge sort
template<typename T>
void merge(std::vector<T>& arr, int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    
    std::vector<T> L(n1), R(n2);
    
    for (int i = 0; i < n1; i++)
        L[i] = arr[left + i];
    for (int j = 0; j < n2; j++)
        R[j] = arr[mid + 1 + j];
    
    int i = 0, j = 0, k = left;
    
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

template<typename T>
void mergeSort(std::vector<T>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        
        // If the array is large enough, use multithreading
        if (right - left > 1000) {
            auto future = std::async(std::launch::async, mergeSort<T>, std::ref(arr), left, mid);
            mergeSort(arr, mid + 1, right);
            future.wait();
        } else {
            mergeSort(arr, left, mid);
            mergeSort(arr, mid + 1, right);
        }
        
        merge(arr, left, mid, right);
    }
}

int main() {
    // Create a graph for cities
    Graph<std::string> cityGraph;
    
    // Add edges between cities with distances
    cityGraph.addEdge("New York", "Boston", 215);
    cityGraph.addEdge("New York", "Philadelphia", 95);
    cityGraph.addEdge("New York", "Washington", 240);
    cityGraph.addEdge("Boston", "Portland", 112);
    cityGraph.addEdge("Philadelphia", "Washington", 140);
    cityGraph.addEdge("Washington", "Richmond", 110);
    cityGraph.addEdge("Richmond", "Raleigh", 170);
    cityGraph.addEdge("Portland", "Concord", 95);
    cityGraph.addEdge("Concord", "Philadelphia", 355);
    cityGraph.addEdge("Richmond", "Charlotte", 330);
    
    std::cout << "Cities in the graph:" << std::endl;
    auto nodes = cityGraph.getNodes();
    for (const auto& node : nodes) {
        std::cout << node << " ";
    }
    std::cout << std::endl << std::endl;
    
    // Run Dijkstra's algorithm
    std::cout << "Shortest distances from New York:" << std::endl;
    auto distances = cityGraph.dijkstra("New York");
    for (const auto& [city, distance] : distances) {
        if (distance == std::numeric_limits<int>::max()) {
            std::cout << city << ": Unreachable" << std::endl;
        } else {
            std::cout << city << ": " << distance << " miles" << std::endl;
        }
    }
    std::cout << std::endl;
    
    // Define a simple heuristic for A* (just use 0 for simplicity)
    auto heuristic = [](const std::string& a, const std::string& b) -> int {
        return 0; // In a real scenario, this would be a distance estimate
    };
    
    // Run A* search
    std::cout << "A* path from New York to Richmond:" << std::endl;
    auto path = cityGraph.astar("New York", "Richmond", heuristic);
    for (size_t i = 0; i < path.size(); i++) {
        std::cout << path[i];
        if (i < path.size() - 1) {
            std::cout << " -> ";
        }
    }
    std::cout << std::endl << std::endl;
    
    // Generate a random array for sorting
    std::cout << "Sorting algorithms demonstration:" << std::endl;
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> distrib(1, 10000);
    
    std::vector<int> arr1(1000);
    for (auto& num : arr1) {
        num = distrib(gen);
    }
    
    std::vector<int> arr2 = arr1; // copy for comparison
    
    // Time the sorts
    auto start1 = std::chrono::high_resolution_clock::now();
    quickSort(arr1, 0, arr1.size() - 1);
    auto end1 = std::chrono::high_resolution_clock::now();
    
    auto start2 = std::chrono::high_resolution_clock::now();
    mergeSort(arr2, 0, arr2.size() - 1);
    auto end2 = std::chrono::high_resolution_clock::now();
    
    std::chrono::duration<double, std::milli> quicksort_time = end1 - start1;
    std::chrono::duration<double, std::milli> mergesort_time = end2 - start2;
    
    std::cout << "Quicksort time: " << quicksort_time.count() << " ms" << std::endl;
    std::cout << "Merge sort time: " << mergesort_time.count() << " ms" << std::endl;
    
    // Verify sorting
    bool quicksort_correct = std::is_sorted(arr1.begin(), arr1.end());
    bool mergesort_correct = std::is_sorted(arr2.begin(), arr2.end());
    
    std::cout << "Quicksort correct: " << (quicksort_correct ? "Yes" : "No") << std::endl;
    std::cout << "Merge sort correct: " << (mergesort_correct ? "Yes" : "No") << std::endl;
    
    return 0;
}
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def main():
    """Run all advanced tests"""
    try:
        # Python advanced tests
        print("\n\n========== ADVANCED PYTHON TESTS ==========")
        python_assignment_name = test_create_advanced_python_assignment()
        time.sleep(2)  # Extra time for complex environment setup
        test_execute_langchain_code(python_assignment_name)
        
        # JavaScript advanced tests
        print("\n\n========== ADVANCED JAVASCRIPT TESTS ==========")
        js_assignment_name = test_create_advanced_js_assignment()
        time.sleep(2)
        test_execute_advanced_js_code(js_assignment_name)
        
        # C++ advanced tests
        print("\n\n========== ADVANCED C++ TESTS ==========")
        cpp_assignment_name = test_create_advanced_cpp_assignment()
        time.sleep(2)
        test_execute_advanced_cpp_code(cpp_assignment_name)
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the server. Make sure the API is running on http://localhost:8000")
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    main()