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
const API_BASE_URL = 'http://localhost:5000/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple API client for analytics operations
class AnalyticsClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.tokens = {}; // Store tokens by email
  }
  
  async login(email, password, role = 'student') {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password,
        role
      });
      
      this.tokens[email] = response.data.token;
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
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

// Generate analytics data
async function generateAnalyticsData() {
  try {
    console.log('Starting analytics generation...');
    
    const client = new AnalyticsClient(API_BASE_URL);
    
    // Login for teachers
    const teachers = [
      { username: 'teacher1', email: 'teacher1@example.com', password: 'password123' },
      { username: 'teacher2', email: 'teacher2@example.com', password: 'password123' }
    ];
    
    // Login for sample students
    const students = [];
    for (let i = 1; i <= 10; i++) {
      students.push({
        username: `student${i}`,
        email: `student${i}@example.com`,
        password: 'password123'
      });
    }
    
    // Login all users
    console.log('Logging in users...');
    for (const teacher of teachers) {
      await client.login(teacher.email, teacher.password, 'teacher');
      console.log(`Logged in as ${teacher.username}`);
    }
    
    for (const student of students) {
      await client.login(student.email, student.password, 'student');
      console.log(`Logged in as ${student.username}`);
      await delay(100);
    }
    
    // Generate teacher analytics
    console.log('\nGenerating teacher analytics...');
    for (const teacher of teachers) {
      // First fetch without refresh (should create initial cache)
      try {
        await client.getAnalytics('teacher', false, teacher.email);
        console.log(`Created analytics cache for teacher ${teacher.username}`);
        
        // Then fetch with refresh to update the cache
        await client.getAnalytics('teacher', true, teacher.email);
        console.log(`Updated analytics data for teacher ${teacher.username}`);
      } catch (error) {
        console.error(`Error generating analytics for teacher ${teacher.username}:`, error.message);
      }
      
      await delay(500);
    }
    
    // Generate student analytics
    console.log('\nGenerating student analytics...');
    for (const student of students) {
      try {
        // First without refresh
        await client.getAnalytics('student', false, student.email);
        console.log(`Created analytics cache for student ${student.username}`);
        
        // Then with refresh
        await client.getAnalytics('student', true, student.email);
        console.log(`Updated analytics data for student ${student.username}`);
      } catch (error) {
        console.error(`Error generating analytics for student ${student.username}:`, error.message);
      }
      
      await delay(500);
    }
    
    // Test clearing cache for one student
    if (students.length > 0) {
      try {
        console.log(`\nTesting cache clearing for student ${students[0].username}...`);
        const clearResult = await client.clearAnalyticsCache(students[0].email, {
          role: 'student'
        });
        console.log('Cache cleared:', clearResult);
        
        // Regenerate the cache
        await client.getAnalytics('student', true, students[0].email);
        console.log(`Regenerated analytics data for student ${students[0].username}`);
      } catch (error) {
        console.error(`Error clearing/regenerating cache:`, error.message);
      }
    }
    
    console.log('\nAnalytics data generation completed successfully!');
    
  } catch (error) {
    console.error('Analytics generation error:', error);
    process.exit(1);
  }
}

// Run the analytics generation function
generateAnalyticsData();