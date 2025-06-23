// Test script for User API endpoints
import axios from 'axios';
import dotenv from 'dotenv';
import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'https://learniq.handjobs.co.in';
console.log(`Using backend URL: ${BACKEND_URL}`);

// Global variables to store data across tests
const testData = {
  teacher: {
    email: `teacher_${Date.now()}@example.com`,
    username: `testTeacher${Date.now()}`,
    password: 'TestPassword123!'
  },
  student: {
    email: `student_${Date.now()}@example.com`,
    username: `testStudent${Date.now()}`,
    password: 'TestPassword123!'
  },
  tokens: {
    teacher: null,
    student: null
  },
  classId: null,
  batchId: null,
  enrollmentCode: null,
  assignmentId: null
};

// Helper function to make API calls
async function callApi(method, endpoint, data = null, token = null) {
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await axios({
      method,
      url: `${BACKEND_URL}${endpoint}`,
      data,
      headers
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status, 
      data: error.response?.data,
      error: error.message 
    };
  }
}

// Test runner
async function runTests() {
  console.log('Starting API tests...');
  
  // 1. Authentication Tests
  await testRegistration();
  await testLogin();
  await testUserProfile();
  
  // 2. Class Management Tests
  await testCreateClass();
  await testGetClasses();
  await testGetClassById();
  await testUpdateClass();
  
  // 3. Batch Management Tests
  await testCreateBatch();
  await testGetBatches();
  await testStudentEnrollment();
  await testGetEnrolledBatches();
  await testGetBatchDetails();
  
  // 4. Assignment Tests
  await testCreateAssignment();
  await testGetAssignments();
  await testGetAssignmentById();
  await testModuleCompletion();
  await testGetCompletedModules();
  
  // 5. AI Generation Test
  await testGenerateAssignment();
  
  // 6. Cleanup Tests
  await testLeaveClass();
  await testDeleteAssignment();
  await testDeleteBatch();
  await testDeleteClass();
  
  console.log('\n✅ All tests completed');
}

// Authentication Tests
async function testRegistration() {
  console.log('\n--- Testing User Registration ---');
  
  // Test teacher registration
  const teacherResult = await callApi('post', '/api/auth/register', {
    username: testData.teacher.username,
    email: testData.teacher.email,
    password: testData.teacher.password,
    role: 'teacher'
  });
  
  console.log('Teacher Registration:', teacherResult.success ? '✅ Success' : '❌ Failed');
  if (teacherResult.success) {
    testData.tokens.teacher = teacherResult.data.token;
  }
  
  // Test student registration
  const studentResult = await callApi('post', '/api/auth/register', {
    username: testData.student.username,
    email: testData.student.email,
    password: testData.student.password,
    role: 'student'
  });
  
  console.log('Student Registration:', studentResult.success ? '✅ Success' : '❌ Failed');
  if (studentResult.success) {
    testData.tokens.student = studentResult.data.token;
  }
}

async function testLogin() {
  console.log('\n--- Testing User Login ---');
  
  // Test teacher login
  const teacherResult = await callApi('post', '/api/auth/login', {
    email: testData.teacher.email,
    password: testData.teacher.password,
    role: 'teacher'
  });
  
  console.log('Teacher Login:', teacherResult.success ? '✅ Success' : '❌ Failed');
  if (teacherResult.success) {
    testData.tokens.teacher = teacherResult.data.token;
  }
  
  // Test student login
  const studentResult = await callApi('post', '/api/auth/login', {
    email: testData.student.email,
    password: testData.student.password,
    role: 'student'
  });
  
  console.log('Student Login:', studentResult.success ? '✅ Success' : '❌ Failed');
  if (studentResult.success) {
    testData.tokens.student = studentResult.data.token;
  }
}

async function testUserProfile() {
  console.log('\n--- Testing User Profile ---');
  
  // Test getting teacher profile
  const teacherProfileResult = await callApi('get', '/api/auth/profile', null, testData.tokens.teacher);
  console.log('Get Teacher Profile:', teacherProfileResult.success ? '✅ Success' : '❌ Failed');
  if (teacherProfileResult.success) {
    assert(teacherProfileResult.data.username === testData.teacher.username);
  }
  
  // Test getting student profile
  const studentProfileResult = await callApi('get', '/api/auth/profile', null, testData.tokens.student);
  console.log('Get Student Profile:', studentProfileResult.success ? '✅ Success' : '❌ Failed');
  if (studentProfileResult.success) {
    assert(studentProfileResult.data.username === testData.student.username);
  }
}

// Class Management Tests
async function testCreateClass() {
  console.log('\n--- Testing Class Creation ---');
  
  const result = await callApi('post', '/api/classes', {
    name: 'Test Programming Class',
    subject: 'Computer Science',
    description: 'A test class for API testing'
  }, testData.tokens.teacher);
  
  console.log('Create Class:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    testData.classId = result.data.class._id;
  }
}

async function testGetClasses() {
  console.log('\n--- Testing Get Classes ---');
  
  const result = await callApi('get', '/api/classes/teacher', null, testData.tokens.teacher);
  console.log('Get Teacher Classes:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(Array.isArray(result.data));
    assert(result.data.some(cls => cls._id === testData.classId));
  }
}

async function testGetClassById() {
  console.log('\n--- Testing Get Class By ID ---');
  
  const result = await callApi('get', `/api/classes/${testData.classId}`, null, testData.tokens.teacher);
  console.log('Get Class By ID:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(result.data._id === testData.classId);
  }
}

async function testUpdateClass() {
  console.log('\n--- Testing Update Class ---');
  
  const result = await callApi('put', `/api/classes/${testData.classId}`, {
    name: 'Updated Test Class',
    description: 'This class has been updated'
  }, testData.tokens.teacher);
  
  console.log('Update Class:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(result.data.class.name === 'Updated Test Class');
  }
}

// Batch Management Tests
async function testCreateBatch() {
  console.log('\n--- Testing Batch Creation ---');
  
  const result = await callApi('post', '/api/batches', {
    name: 'Test Batch 2023',
    classId: testData.classId
  }, testData.tokens.teacher);
  
  console.log('Create Batch:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    testData.batchId = result.data.batch._id;
    testData.enrollmentCode = result.data.batch.enrollmentCode;
  }
}

async function testGetBatches() {
  console.log('\n--- Testing Get Batches for Class ---');
  
  const result = await callApi('get', `/api/classes/${testData.classId}/batches`, null, testData.tokens.teacher);
  console.log('Get Class Batches:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(Array.isArray(result.data));
    assert(result.data.some(batch => batch._id === testData.batchId));
  }
}

async function testStudentEnrollment() {
  console.log('\n--- Testing Student Enrollment ---');
  
  const result = await callApi('post', '/api/batches/enroll', {
    enrollmentCode: testData.enrollmentCode
  }, testData.tokens.student);
  
  console.log('Student Enrollment:', result.success ? '✅ Success' : '❌ Failed');
}

async function testGetEnrolledBatches() {
  console.log('\n--- Testing Get Enrolled Batches ---');
  
  const result = await callApi('get', '/api/batches/enrolled', null, testData.tokens.student);
  console.log('Get Enrolled Batches:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(Array.isArray(result.data));
    assert(result.data.some(batch => batch._id === testData.batchId));
  }
}

async function testGetBatchDetails() {
  console.log('\n--- Testing Get Batch Details ---');
  
  const result = await callApi('get', `/api/batches/${testData.batchId}`, null, testData.tokens.teacher);
  console.log('Get Batch Details:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(result.data._id === testData.batchId);
  }
}

// Assignment Tests
async function testCreateAssignment() {
  console.log('\n--- Testing Assignment Creation ---');
  
  const assignmentData = {
    title: 'Test Assignment',
    description: 'This is a test assignment',
    classId: testData.classId,
    language: 'JavaScript',
    requirements: ['Node.js'],
    modules: [
      {
        id: 1,
        title: 'Introduction',
        learningText: 'This is the first module',
        codeTemplate: 'console.log("Hello, world!");\n<editable>// Write your code here</editable>',
        hints: ['Try using console.log'],
        expectedOutput: 'A greeting message'
      },
      {
        id: 2,
        title: 'Variables',
        learningText: 'This is the second module',
        codeTemplate: 'let x = 10;\n<editable>// Define a variable y</editable>\nconsole.log(x + y);',
        hints: ['Use let or const'],
        expectedOutput: 'Sum of x and y'
      }
    ]
  };
  
  const result = await callApi('post', '/api/assignments', assignmentData, testData.tokens.teacher);
  console.log('Create Assignment:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    testData.assignmentId = result.data.assignment._id;
  }
}

async function testGetAssignments() {
  console.log('\n--- Testing Get Assignments for Class ---');
  
  const result = await callApi('get', `/api/classes/${testData.classId}/assignments`, null, testData.tokens.teacher);
  console.log('Get Class Assignments:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(Array.isArray(result.data));
    assert(result.data.some(assignment => assignment._id === testData.assignmentId));
  }
}

async function testGetAssignmentById() {
  console.log('\n--- Testing Get Assignment Details ---');
  
  const result = await callApi('get', `/api/assignments/${testData.assignmentId}`, null, testData.tokens.student);
  console.log('Get Assignment Details:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(result.data._id === testData.assignmentId);
  }
}

async function testModuleCompletion() {
  console.log('\n--- Testing Module Completion ---');
  
  const moduleId = 1;
  const result = await callApi('post', `/api/assignments/${testData.assignmentId}/modules/${moduleId}/complete`, {
    code: 'console.log("Completed module 1!");'
  }, testData.tokens.student);
  
  console.log('Mark Module as Complete:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(result.data.completedModules.includes(moduleId));
  }
}

async function testGetCompletedModules() {
  console.log('\n--- Testing Get Completed Modules ---');
  
  const result = await callApi('get', `/api/assignments/${testData.assignmentId}/completed-modules`, null, testData.tokens.student);
  console.log('Get Completed Modules:', result.success ? '✅ Success' : '❌ Failed');
  if (result.success) {
    assert(Array.isArray(result.data.completedModules));
    assert(result.data.completedModules.includes(1));
  }
}

// Cleanup Tests
async function testLeaveClass() {
  console.log('\n--- Testing Student Leaving Batch ---');
  
  const result = await callApi('post', `/api/batches/${testData.batchId}/leave`, {}, testData.tokens.student);
  console.log('Leave Batch:', result.success ? '✅ Success' : '❌ Failed');
}

async function testDeleteAssignment() {
  console.log('\n--- Testing Delete Assignment ---');
  
  const result = await callApi('delete', `/api/assignments/${testData.assignmentId}`, null, testData.tokens.teacher);
  console.log('Delete Assignment:', result.success ? '✅ Success' : '❌ Failed');
}

async function testDeleteBatch() {
  console.log('\n--- Testing Delete Batch ---');
  
  const result = await callApi('delete', `/api/batches/${testData.batchId}`, null, testData.tokens.teacher);
  console.log('Delete Batch:', result.success ? '✅ Success' : '❌ Failed');
}

async function testDeleteClass() {
  console.log('\n--- Testing Delete Class ---');
  
  const result = await callApi('delete', `/api/classes/${testData.classId}`, null, testData.tokens.teacher);
  console.log('Delete Class:', result.success ? '✅ Success' : '❌ Failed');
}

// Test Gemini API
async function testGenerateAssignment() {
  console.log('\n--- Testing Assignment Generation ---');
  
  const result = await callApi('post', '/api/generate-assignment', {
    description: 'Create a simple Todo list app in JavaScript'
  }, testData.tokens.teacher);
  
  console.log('Generate Assignment:', result.success ? '✅ Success' : '❌ Failed');
  if (!result.success) {
    console.log('Error:', result.data);
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});