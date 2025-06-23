import requests
import time
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_create_assignment():
    """Test creating a new assignment environment"""
    print("\n=== Testing Create Assignment ===")
    
    assignment_data = {
        "assignment_name": "test_python_assignment",
        "language": "python",
        "requirements": ["numpy==1.26.4", "pandas==2.1.4"]
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_create_js_assignment():
    """Test creating a new JavaScript assignment environment"""
    print("\n=== Testing Create JavaScript Assignment ===")
    
    assignment_data = {
        "assignment_name": "test_js_assignment",
        "language": "javascript",
        "requirements": ["lodash", "axios"]
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_create_cpp_assignment():
    """Test creating a new C++ assignment environment"""
    print("\n=== Testing Create C++ Assignment ===")
    
    assignment_data = {
        "assignment_name": "test_cpp_assignment",
        "language": "cpp",
        "requirements": []  # C++ might not have package requirements like other languages
    }
    
    response = requests.post(f"{BASE_URL}/create/assignment", json=assignment_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return assignment_data["assignment_name"]

def test_execute_python_code(assignment_name):
    """Test executing Python code"""
    print("\n=== Testing Execute Python Code ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
import numpy as np

# Create a simple array and perform operations
array = np.array([1, 2, 3, 4, 5])
mean = np.mean(array)
std = np.std(array)

print(f"Array: {array}")
print(f"Mean: {mean}")
print(f"Standard Deviation: {std}")
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_js_code(assignment_name):
    """Test executing JavaScript code"""
    print("\n=== Testing Execute JavaScript Code ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
const _ = require('lodash');

// Create an array and perform operations
const array = [1, 2, 3, 4, 5];
const sum = _.sum(array);
const mean = sum / array.length;
const squareDiffs = array.map(value => Math.pow(value - mean, 2));
const variance = _.sum(squareDiffs) / array.length;
const std = Math.sqrt(variance);

console.log(`Array: ${array}`);
console.log(`Mean: ${mean}`);
console.log(`Standard Deviation: ${std}`);
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_cpp_code(assignment_name):
    """Test executing C++ code"""
    print("\n=== Testing Execute C++ Code ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
#include <iostream>
#include <vector>
#include <numeric>
#include <cmath>

int main() {
    // Create a vector and perform operations
    std::vector<int> array = {1, 2, 3, 4, 5};
    
    // Calculate mean
    double sum = std::accumulate(array.begin(), array.end(), 0.0);
    double mean = sum / array.size();
    
    // Calculate standard deviation
    double squareSum = 0.0;
    for(int num : array) {
        squareSum += std::pow(num - mean, 2);
    }
    double std = std::sqrt(squareSum / array.size());
    
    // Print results
    std::cout << "Array: ";
    for(int num : array) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    std::cout << "Mean: " << mean << std::endl;
    std::cout << "Standard Deviation: " << std << std::endl;
    
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

def test_execute_code_with_error(assignment_name):
    """Test executing code that produces an error"""
    print("\n=== Testing Execute Code with Error ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
print("Starting execution")
# This will cause an error
undefined_variable
print("This won't be reached")
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_js_code_with_error(assignment_name):
    """Test executing JavaScript code that produces an error"""
    print("\n=== Testing Execute JavaScript Code with Error ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
console.log("Starting execution");
// This will cause an error
undefinedVariable;
console.log("This won't be reached");
"""
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Output: {result.get('output', '')}")
    print(f"Error: {result.get('error', '')}")
    print(f"Execution Time: {result.get('execution_time', '')} seconds")

def test_execute_cpp_code_with_error(assignment_name):
    """Test executing C++ code that produces an error"""
    print("\n=== Testing Execute C++ Code with Error ===")
    
    execution_data = {
        "assignment_name": assignment_name,
        "code": """
#include <iostream>

int main() {
    std::cout << "Starting execution" << std::endl;
    // This will cause an error - undeclared variable
    std::cout << undefinedVariable << std::endl;
    std::cout << "This won't be reached" << std::endl;
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

def test_execute_nonexistent_assignment():
    """Test executing code for a nonexistent assignment"""
    print("\n=== Testing Execute Code for Nonexistent Assignment ===")
    
    execution_data = {
        "assignment_name": "nonexistent_assignment",
        "code": "print('Hello, world!')"
    }
    
    response = requests.post(f"{BASE_URL}/execute/code", json=execution_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

def main():
    """Run all tests"""
    try:
        # Python tests
        print("\n\n========== PYTHON TESTS ==========")
        assignment_name = test_create_assignment()
        time.sleep(1)
        test_execute_python_code(assignment_name)
        test_execute_code_with_error(assignment_name)
        
        # JavaScript tests
        print("\n\n========== JAVASCRIPT TESTS ==========")
        js_assignment_name = test_create_js_assignment()
        time.sleep(1)
        test_execute_js_code(js_assignment_name)
        test_execute_js_code_with_error(js_assignment_name)
        
        # C++ tests
        print("\n\n========== C++ TESTS ==========")
        cpp_assignment_name = test_create_cpp_assignment()
        time.sleep(1)
        test_execute_cpp_code(cpp_assignment_name)
        test_execute_cpp_code_with_error(cpp_assignment_name)
        
        # Test nonexistent assignment
        test_execute_nonexistent_assignment()
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the server. Make sure the API is running on http://localhost:8000")

if __name__ == "__main__":
    main()