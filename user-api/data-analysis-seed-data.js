import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Create meta information for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API base URL
const API_BASE_URL = 'https://learniq.handjobs.co.in/api';

// Mock data templates
const subjects = [
  'Python Programming', 'JavaScript Fundamentals', 'Web Development',
  'Data Structures', 'Algorithms', 'Machine Learning Basics',
  'Database Systems', 'Mobile App Development', 'Network Security'
];

const programmingLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'SQL'];

// Helper functions
const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate modules for assignments
const generateModules = (language) => {
  const numModules = Math.floor(Math.random() * 3) + 3; // 3-5 modules
  const modules = [];
  
  for (let i = 1; i <= numModules; i++) {
    modules.push({
      id: i,
      title: `Module ${i}: ${['Introduction', 'Basic Concepts', 'Advanced Features', 'Practice', 'Final Project'][i % 5]}`,
      learningText: `This module covers important concepts in ${language} programming. Follow the instructions carefully and complete the code.`,
      codeTemplate: language === 'Python' ? 
        `# Module ${i} Template\ndef main():\n    # <editable>\n    # Write your code here\n    print("Hello from Module ${i}")\n    # </editable>\n\nif __name__ == "__main__":\n    main()` : 
        `// Module ${i} Template\nfunction main() {\n    // <editable>\n    // Write your code here\n    console.log("Hello from Module ${i}");\n    // </editable>\n}\n\nmain();`,
      hints: [
        "Start by understanding the problem requirements",
        "Remember to use proper syntax",
        "Test your code with different inputs"
      ],
      expectedOutput: `Expected output shows correct implementation of Module ${i}`
    });
  }
  
  return modules;
};

// API client with authentication
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.tokens = {}; // Store tokens by user type
  }
  
  async register(username, email, password, role = 'student') {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/register`, {
        username,
        email,
        password,
        role
      });
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async login(email, password, role = 'student') {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password,
        role
      });
      
      // Store token
      this.tokens[email] = response.data.token;
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async createClass(name, subject, description, teacherEmail) {
    try {
      const token = this.tokens[teacherEmail];
      if (!token) throw new Error(`Teacher ${teacherEmail} not logged in`);
      
      const response = await axios.post(
        `${this.baseUrl}/classes`,
        { name, subject, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Create class error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async createBatch(name, classId, teacherEmail) {
    try {
      const token = this.tokens[teacherEmail];
      if (!token) throw new Error(`Teacher ${teacherEmail} not logged in`);
      
      const response = await axios.post(
        `${this.baseUrl}/batches`,
        { name, classId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Create batch error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async enrollStudent(enrollmentCode, studentEmail) {
    try {
      const token = this.tokens[studentEmail];
      if (!token) throw new Error(`Student ${studentEmail} not logged in`);
      
      const response = await axios.post(
        `${this.baseUrl}/batches/enroll`,
        { enrollmentCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Enrollment error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async createAssignment(title, description, classId, language, modules, teacherEmail) {
    try {
      const token = this.tokens[teacherEmail];
      if (!token) throw new Error(`Teacher ${teacherEmail} not logged in`);
      
      const response = await axios.post(
        `${this.baseUrl}/assignments`,
        { 
          title, 
          description, 
          classId, // Changed from 'class' to 'classId' to match API expectation
          language, 
          requirements: [language, 'Code Editor'],
          modules 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Create assignment error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async submitModule(assignmentId, moduleId, code, studentEmail) {
    try {
      const token = this.tokens[studentEmail];
      if (!token) throw new Error(`Student ${studentEmail} not logged in`);
      
      // Using the assignment submission endpoint
      const response = await axios.post(
        `${this.baseUrl}/assignments/${assignmentId}/submit`,
        { moduleId, code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Module submission error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async getAnalytics(role, refresh = false, userEmail) {
    try {
      const token = this.tokens[userEmail];
      if (!token) throw new Error(`User ${userEmail} not logged in`);
      
      let endpoint;
      if (role === 'teacher') {
        endpoint = `/analytics/teacher`;
      } else if (role === 'student') {
        endpoint = `/analytics/student`;
      } else if (role === 'admin') {
        endpoint = `/analytics/admin`;
      } else {
        throw new Error(`Invalid role for analytics: ${role}`);
      }
      
      // Add refresh parameter if true
      const queryParams = refresh ? '?refresh=true' : '';
      
      const response = await axios.get(
        `${this.baseUrl}${endpoint}${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Analytics fetch error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async clearAnalyticsCache(userEmail, options = {}) {
    try {
      const token = this.tokens[userEmail];
      if (!token) throw new Error(`User ${userEmail} not logged in`);
      
      // Build query parameters
      const queryParams = [];
      if (options.userId) queryParams.push(`userId=${options.userId}`);
      if (options.role) queryParams.push(`role=${options.role}`);
      if (options.type) queryParams.push(`type=${options.type}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await axios.delete(
        `${this.baseUrl}/analytics/cache${queryString}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Cache clear error:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Seed data function
async function seedData() {
  try {
    console.log('Starting API-based data seeding...');
    
    const apiClient = new ApiClient(API_BASE_URL);
    
    // 1. Create 2 teachers
    const teachers = [];
    for (let i = 1; i <= 2; i++) {
      const username = `teacher${i}`;
      const email = `teacher${i}@example.com`;
      const password = 'password123';
      
      console.log(`Registering teacher ${i}...`);
      const teacherData = await apiClient.register(username, email, password, 'teacher');
      teachers.push({
        id: teacherData.user.id,
        username,
        email
      });
      
      console.log(`Logging in as teacher ${i}...`);
      await apiClient.login(email, password, 'teacher');
      
      // Add small delay between requests
      await delay(500);
    }
    
    // 2. Create 50 students
    const students = [];
    
    // Add the missing for loop declaration here
    for (let i = 1; i <= 50; i++) {
      const username = `student${i}`;
      const email = `student${i}@example.com`;
      const password = 'password123';
      
      if (i % 10 === 1) {
        console.log(`Registering students ${i}-${Math.min(i+9, 50)}...`);
      }
      
      const studentData = await apiClient.register(username, email, password, 'student');
      students.push({
        id: studentData.user.id,
        username,
        email
      });
      
      // Login each student too
      await apiClient.login(email, password, 'student');
      
      // Add small delay between requests to avoid rate limiting
      await delay(200);
    }
    
    // 3. Create classes (2-3 per teacher)
    const classes = [];
    for (const teacher of teachers) {
      const classCount = Math.floor(Math.random() * 2) + 2; // 2-3 classes
      
      console.log(`Creating ${classCount} classes for teacher ${teacher.username}...`);
      
      for (let i = 1; i <= classCount; i++) {
        const subject = randomElement(subjects);
        const classData = await apiClient.createClass(
          `${subject} - Class ${classes.length + 1}`,
          subject,
          `A comprehensive course covering various aspects of ${subject}.`,
          teacher.email
        );
        
        classes.push({
          id: classData.class._id,
          name: classData.class.name,
          teacher: teacher
        });
        
        await delay(300);
      }
    }
    
    console.log(`Created ${classes.length} classes`);
    
    // 4. Create batches for each class and enroll students
    const batches = [];
    for (const classObj of classes) {
      const batchCount = Math.floor(Math.random() * 2) + 1; // 1-2 batches
      
      for (let i = 1; i <= batchCount; i++) {
        console.log(`Creating batch ${i} for class "${classObj.name}"...`);
        
        const batchData = await apiClient.createBatch(
          `Batch ${batches.length + 1} - ${classObj.name}`,
          classObj.id,
          classObj.teacher.email
        );
        
        const batch = {
          id: batchData.batch._id,
          name: batchData.batch.name,
          class: classObj,
          enrollmentCode: batchData.batch.enrollmentCode,
          students: []
        };
        
        // Enroll random students (10-25 per batch)
        const studentCount = Math.floor(Math.random() * 16) + 10;
        const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
        const selectedStudents = shuffledStudents.slice(0, studentCount);
        
        console.log(`Enrolling ${studentCount} students in batch "${batch.name}"...`);
        
        for (const student of selectedStudents) {
          await apiClient.enrollStudent(batch.enrollmentCode, student.email);
          batch.students.push(student);
          await delay(100);
        }
        
        batches.push(batch);
        await delay(300);
      }
    }
    
    console.log(`Created ${batches.length} batches with student enrollments`);
    
    // 5. Create assignments for each class
    const assignments = [];
    for (const classObj of classes) {
      const assignmentCount = Math.floor(Math.random() * 4) + 2; // 2-5 assignments
      
      console.log(`Creating ${assignmentCount} assignments for class "${classObj.name}"...`);
      
      for (let i = 1; i <= assignmentCount; i++) {
        const language = randomElement(programmingLanguages);
        const title = `Assignment ${i}: ${language} ${['Basics', 'Advanced', 'Project', 'Challenge', 'Practice'][i % 5]}`;
        const description = `This assignment will test your knowledge of ${language} programming concepts.`;
        
        const modules = generateModules(language);
        
        const assignmentData = await apiClient.createAssignment(
          title,
          description,
          classObj.id,
          language,
          modules,
          classObj.teacher.email
        );
        
        assignments.push({
          id: assignmentData.assignment._id,
          title,
          class: classObj,
          modules: modules,
          language
        });
        
        await delay(300);
      }
    }
    
    console.log(`Created ${assignments.length} assignments`);
    
    // 6. Create student submissions with varying completion states
    let totalSubmissions = 0;
    
    // For each assignment, get enrolled students and create submissions
    for (const assignment of assignments) {
      // Find batches for this class
      const classBatches = batches.filter(b => b.class.id === assignment.class.id);
      
      // Get all unique enrolled students
      const enrolledStudents = [];
      const studentIds = new Set();
      
      classBatches.forEach(batch => {
        batch.students.forEach(student => {
          if (!studentIds.has(student.id)) {
            studentIds.add(student.id);
            enrolledStudents.push(student);
          }
        });
      });
      
      console.log(`Creating submissions for assignment "${assignment.title}" (${enrolledStudents.length} students)...`);
      
      // Create student submissions with varying progress
      for (const student of enrolledStudents) {
        // Determine completion status with weighted randomness
        // 20% not started, 30% in progress, 50% completed
        const rand = Math.random();
        
        if (rand < 0.2) {
          // Not started - no submissions
          continue;
        } else if (rand < 0.5) {
          // In progress - submit some modules
          const moduleCount = assignment.modules.length;
          const completedCount = Math.floor(Math.random() * (moduleCount - 1)) + 1;
          
          // Submit completed modules with time spacing
          for (let i = 0; i < completedCount; i++) {
            const moduleId = assignment.modules[i].id;
            
            await apiClient.submitModule(
              assignment.id,
              moduleId,
              `// Student ${student.username} submission for module ${moduleId}\nconsole.log("This is my solution for module ${moduleId}");`,
              student.email
            );
            
            totalSubmissions++;
            await delay(100);
          }
        } else {
          // Completed - submit all modules
          for (const module of assignment.modules) {
            await apiClient.submitModule(
              assignment.id,
              module.id,
              `// Student ${student.username} submission for module ${module.id}\nconsole.log("This is my complete solution for module ${module.id}");`,
              student.email
            );
            
            totalSubmissions++;
            await delay(100);
          }
        }
      }
    }
    
    console.log(`Created ${totalSubmissions} module submissions`);
    
    // Now generate analytics data by making API calls for different user roles
    console.log('\nGenerating analytics data...');
    
    // First for teachers
    console.log('Generating teacher analytics...');
    for (const teacher of teachers) {
      // First fetch without refresh (should create initial cache)
      await apiClient.getAnalytics('teacher', false, teacher.email);
      console.log(`Created analytics cache for teacher ${teacher.username}`);
      
      // Then fetch with refresh to update the cache
      await apiClient.getAnalytics('teacher', true, teacher.email);
      console.log(`Updated analytics data for teacher ${teacher.username}`);
      
      await delay(500);
    }
    
    // For a sample of students (first 10)
    console.log('Generating student analytics...');
    for (let i = 0; i < Math.min(10, students.length); i++) {
      const student = students[i];
      
      // First without refresh
      await apiClient.getAnalytics('student', false, student.email);
      console.log(`Created analytics cache for student ${student.username}`);
      
      // Then with refresh
      await apiClient.getAnalytics('student', true, student.email);
      console.log(`Updated analytics data for student ${student.username}`);
      
      await delay(500);
    }
    
    // Test clearing cache for one student
    if (students.length > 0) {
      console.log(`Testing cache clearing for student ${students[0].username}...`);
      const clearResult = await apiClient.clearAnalyticsCache(students[0].email, {
        userId: students[0].id,
        role: 'student'
      });
      console.log('Cache cleared:', clearResult);
      
      // Regenerate the cache
      await apiClient.getAnalytics('student', true, students[0].email);
      console.log(`Regenerated analytics data for student ${students[0].username}`);
    }
    
    // For admin (if we need to test admin analytics, we'd need to create an admin user first)
    // Since your current code doesn't create admin users, we'll skip this part
    
    console.log('Analytics data generation completed');
    
    console.log('Database seeded successfully through API!');
    console.log(`
    Summary:
    - ${teachers.length} teachers
    - ${students.length} students
    - ${classes.length} classes
    - ${batches.length} batches
    - ${assignments.length} assignments
    - ${totalSubmissions} module submissions
    - Analytics data generated for ${teachers.length} teachers and 10 students
    `);
    
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();