import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`ERROR: Required environment variables missing: ${missingEnvVars.join(', ')}`);
  process.exit(1); // Exit with error code
}

// Create meta information for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security headers
app.use(helmet());

// JWT Secret check
if (process.env.JWT_SECRET === 'your_jwt_secret_key') {
  console.error('ERROR: Using default JWT_SECRET. This is not secure for production.');
}

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000 // 5 second timeout for server selection
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  }
});

// Class Schema
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Batch Schema
const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  enrollmentCode: {
    type: String,
    required: true,
    unique: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a unique enrollment code
const generateEnrollmentCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Student Assignment Schema
const studentAssignmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed'],
    default: 'assigned'
  },
  progress: {
    type: Number,
    default: 0
  },
  submissions: [{
    moduleId: Number,
    code: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const analyticsCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Cache expires after 1 hour (3600 seconds)
  }
});

// Compound index for faster lookups
analyticsCacheSchema.index({ userId: 1, role: 1, type: 1 });
const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);
const Batch = mongoose.model('Batch', batchSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const StudentAssignment = mongoose.model('StudentAssignment', studentAssignmentSchema);
const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);

// Helper functions for validation
const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validateUsername = (username) => {
  // Only allow alphanumeric characters, -, _, and spaces, between 3-30 chars
  const re = /^[a-zA-Z0-9_\- ]{3,30}$/;
  return re.test(username);
};

// Centralized error handler
const handleError = (error, res) => {
  console.error('Error:', error);
  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ message: 'An internal server error occurred' });
  } else {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Data encryption/decryption utilities using SHA-256
const encryptionKey = process.env.ENCRYPTION_KEY;

const hashData = (data) => {
  if (!data) return data;
  try {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(data.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Return original data if encryption fails
  }
};

const unhashData = (data) => {
  if (!data) return data;
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(data.toString(), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return data; // Return original data if decryption fails
  }
};

// Rate limiters for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: 'Too many login attempts. Please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: { message: 'Too many registration attempts. Please try again later.' }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Routes
// Register User
app.post('/api/auth/register', 
  (process.env.RATE_LIMITING_ENABLED !== 'false') ? registerLimiter : (req, res, next) => next(), 
  async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role if provided
    if (role && !['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if username is valid
    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'Username can only contain alphanumeric characters, -, _, and spaces, and must be 3-30 characters long.' });
    }

    // Check if email is valid
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Hash sensitive data
    const hashedEmail = hashData(email);

    // Check if user already exists - search by hashed email
    const existingUser = await User.findOne({ email: hashedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash username
    const hashedUsername = hashData(username);

    // Check for duplicate username
    const existingUsername = await User.findOne({ username: hashedUsername });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for stronger hashing
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed data
    const user = new User({
      username: hashedUsername,
      email: hashedEmail,
      password: hashedPassword,
      role: role || 'student' // Default to student if no role specified
    });

    // Save user to database
    const savedUser = await user.save();

    // Create JWT token with unhashed data
    const token = jwt.sign(
      { id: savedUser._id, username: username, role: savedUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        username: username, // Return original username
        email: email, // Return original email
        role: savedUser.role
      }
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Login User
app.post('/api/auth/login', 
  (process.env.RATE_LIMITING_ENABLED !== 'false') ? authLimiter : (req, res, next) => next(), 
  async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if email is valid format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Hash email for database lookup
    const hashedEmail = hashData(email);

    // Check if user exists with hashed email
    const user = await User.findOne({ email: hashedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // If role is specified in the request, validate that it matches the user's actual role
    if (role && role !== user.role) {
      return res.status(403).json({ 
        message: `Access denied. You cannot login as ${role}. Your role is ${user.role}.`
      });
    }

    // Unhash username before returning
    const originalUsername = unhashData(user.username);
    
    // Create JWT token with unhashed data
    const token = jwt.sign(
      { id: user._id, username: originalUsername, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: originalUsername,
        email: email, // Return original email from request
        role: user.role
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
});

// Get User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Unhash sensitive data before returning
    const responseUser = {
      ...user.toObject(),
      username: unhashData(user.username),
      email: unhashData(user.email)
    };

    res.status(200).json(responseUser);
  } catch (error) {
    handleError(error, res);
  }
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// Forgot Password - Request
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Find user (but don't reveal if user exists for security)
    const user = await User.findOne({ email });
    
    // Generic response whether user exists or not to prevent email enumeration
    if (!user) {
      return res.status(200).json({ 
        message: 'If your email exists in our system, a reset link has been sent' 
      });
    }

    // Generate password reset token with more security
    // Include part of the hashed password to invalidate token when password changes
    const tokenData = {
      id: user._id,
      version: user.password.substring(0, 10) // This changes when password changes
    };
    
    const token = jwt.sign(
      tokenData,
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' } // Short expiry time for security
    );

    // In production, send email with reset link
    // For now, just return the token (remove in production)
    
    res.status(200).json({ 
      message: 'If your email exists in our system, a reset link has been sent',
      resetToken: token // Don't include this in production
    });
  } catch (error) {
    return handleError(error, res);
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || 'your_reset_secret_key');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// Assignment Generator Agent
class AssignmentGeneratorAgent {
  constructor(geminiApiKey) {
    this.apiKey = geminiApiKey;
    this.geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  async generateAssignment(description, classId = null) {
    // Generate the detailed assignment structure using Gemini API
    const prompt = this._createPrompt(description, classId);
    const response = await this._callGeminiApi(prompt);
    
    // Parse and validate the generated assignment
    const assignment = this._parseResponse(response);
    
    return assignment;
  }

  _createPrompt(description, classId) {
    return `
You are an expert computer science educator. Create a detailed coding assignment based on this simple description: "${description}"

The assignment should be structured like a Codecademy-style interactive tutorial with progressive modules.

For each module:
1. Create clear learning text explaining the concept
2. Provide code templates with <EDITABLE> tags around sections students should complete
3. Include helpful hints for students
4. Specify the expected output

Return your response as a valid JSON object with this structure:
{
  "assignment": {
    "title": "Assignment title",
    "description": "Overall description of the assignment",
    "language": "Python",
    "requirements": ["numpy", "matplotlib"],
    "class": "${classId || ''}",
    "modules": [
      {
        "id": 1,
        "title": "Module title",
        "learningText": "Explanatory text for this module",
        "codeTemplate": "Full code with <EDITABLE>student code here</EDITABLE> tags",
        "hints": ["Hint 1", "Hint 2", "Hint 3"],
        "expectedOutput": "Description of expected output"
      },
      // Additional modules...
    ]
  }
}

Make sure:
- Code in the codeTemplate should be valid, executable code when the <EDITABLE> sections are completed
- Each module should build progressively on previous modules
- There should be 4-6 modules that break down the assignment into logical learning steps
- Include appropriate imports and setup code in the first module
- The final module should include test code to demonstrate the solution works
- IMPORTANT: Specify "language" (e.g., "Python", "JavaScript") and "requirements" (list of libraries/packages needed)
- Use <editable> tags (lowercase) in the code template, not <EDITABLE>

Ensure the JSON is well-formed without any formatting errors.
`;
  }

  async _callGeminiApi(prompt) {
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey
    };
    
    const data = {
      "contents": [
        {
          "role": "user",
          "parts": [{"text": prompt}]
        }
      ],
      "generationConfig": {
        "temperature": 0.2,
        "topP": 0.8,
        "topK": 40,
        "maxOutputTokens": 8192
      }
    };
    
    try {
      const response = await axios.post(this.geminiUrl, data, { headers });
      return response.data;
    } catch (error) {
      console.error(`API call failed: ${error.message}`);
      return { error: error.message };
    }
  }

  _parseResponse(response) {
    try {
      // Extract the text from the response
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Find JSON object in the text (it might be surrounded by markdown code blocks)
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const assignment = JSON.parse(jsonStr);
        return this._validateAssignment(assignment);
      } else {
        console.log("No valid JSON found in response");
        return { error: "No valid JSON found in response", raw_response: text };
      }
    } catch (e) {
      console.error(`Error parsing response: ${e}`);
      return { error: e.message, raw_response: response };
    }
  }

  _validateAssignment(assignment) {
    // Check if the assignment has the expected structure
    if (!assignment.assignment) {
      console.log("Warning: 'assignment' key missing, restructuring response");
      return { assignment };
    }
    
    // Ensure all required fields are present
    const assignmentData = assignment.assignment;
    if (!assignmentData.language) {
      assignmentData.language = "Python";
    }
    
    if (!assignmentData.requirements || !Array.isArray(assignmentData.requirements)) {
      assignmentData.requirements = [];
    }
    
    for (const module of assignmentData.modules) {
      module.codeTemplate = module.codeTemplate
        .replace(/<EDITABLE>/g, "<editable>")
        .replace(/<\/EDITABLE>/g, "</editable>");
      
      // Ensure code template has <editable> tags
      if (!module.codeTemplate.includes("<editable>")) {
        const lines = module.codeTemplate.split("\n");
        module.codeTemplate = [
          lines[0],
          "<editable>",
          ...lines.slice(1),
          "</editable>"
        ].join("\n");
      }
    }
    
    return assignment;
  }

  generateModulesJson(assignment) {
    if (!assignment.assignment) {
      return [];
    }
    
    const modules = [];
    for (const module of assignment.assignment.modules || []) {
      // Process the code template to extract editable and non-editable parts
      const codeParts = this._splitCodeTemplate(module.codeTemplate || "");
      
      modules.push({
        id: module.id || 0,
        title: module.title || "",
        learningText: module.learningText || "",
        codeParts,
        hints: module.hints || [],
        expectedOutput: module.expectedOutput || ""
      });
    }
    
    return modules;
  }

  _splitCodeTemplate(codeTemplate) {
    const parts = [];
    let remaining = codeTemplate;
    
    // Convert <EDITABLE> to <editable> if needed
    remaining = remaining
      .replace(/<EDITABLE>/g, "<editable>")
      .replace(/<\/EDITABLE>/g, "</editable>");
    
    while (remaining) {
      // Find the next editable section
      const editableStart = remaining.indexOf("<editable>");
      
      if (editableStart < 0) {
        // No more editable sections, add the rest as non-editable
        if (remaining.trim()) {
          parts.push({ code: remaining, editable: false });
        }
        break;
      }
      
      // Add non-editable part before the editable section
      if (editableStart > 0) {
        parts.push({ code: remaining.substring(0, editableStart), editable: false });
      }
      
      // Extract the editable part
      const editableEnd = remaining.indexOf("</editable>", editableStart);
      if (editableEnd < 0) {
        // Missing closing tag, treat the rest as editable
        const editableContent = remaining.substring(editableStart + 10);  // 10 is len("<editable>")
        parts.push({ code: editableContent, editable: true });
        break;
      }
      
      const editableContent = remaining.substring(editableStart + 10, editableEnd);
      parts.push({ code: editableContent, editable: true });
      
      // Continue with the rest of the code
      remaining = remaining.substring(editableEnd + 11);  // 11 is len("</editable>")
    }
    
    return parts;
  }
}

// Generate Assignment Endpoint
app.post('/api/generate-assignment', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Missing description in request body" });
    }
    
    // Check if user is authorized (teacher role)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers and admins can generate assignments' });
    }
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const agent = new AssignmentGeneratorAgent(geminiApiKey);
    
    // Generate the assignment
    const assignment = await agent.generateAssignment(description);
    
    if (assignment.error) {
      return res.status(500).json({ 
        error: assignment.error,
        rawResponse: assignment.raw_response 
      });
    }
    
    // Generate the modules for the learning platform
    const modules = agent.generateModulesJson(assignment);
    
    // Skip saving files to disk - directly return the response
    
    // Return both the full assignment and the modules
    res.json({
      success: true,
      assignment: assignment.assignment,
      modules
    });
    
  } catch (error) {
    console.error(`Error handling request: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Create a class (teachers only)
app.post('/api/classes', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classes' });
    }

    const { name, subject, description } = req.body;

    // Validate input
    if (!name || !subject) {
      return res.status(400).json({ message: 'Class name and subject are required' });
    }

    // Create the class
    const newClass = new Class({
      name,
      subject,
      description,
      teacher: req.user.id
    });

    const savedClass = await newClass.save();

    res.status(201).json({
      message: 'Class created successfully',
      class: savedClass
    });
  } catch (error) {
    console.error('Class creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all classes for a teacher
app.get('/api/classes/teacher', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const classes = await Class.find({ teacher: req.user.id });

    res.status(200).json(classes);
  } catch (error) {
    console.error('Fetch classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific class by ID
app.get('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is the teacher of this class or a student in one of its batches
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(classItem);
  } catch (error) {
    console.error('Fetch class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a class (teachers only)
app.put('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update classes' });
    }

    const classId = req.params.id;
    const { name, subject, description } = req.body;

    // Find the class
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher owns this class
    if (classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update the class with new values
    if (name) classItem.name = name;
    if (subject) classItem.subject = subject;
    if (description !== undefined) classItem.description = description;

    const updatedClass = await classItem.save();

    res.status(200).json({
      message: 'Class updated successfully',
      class: updatedClass
    });
  } catch (error) {
    console.error('Class update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a class (teachers only)
app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete classes' });
    }

    const classId = req.params.id;

    // Find the class
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher owns this class
    if (classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all batches for this class
    await Batch.deleteMany({ class: classId });

    // Delete all assignments for this class
    const deletedAssignments = await Assignment.find({ class: classId });
    const assignmentIds = deletedAssignments.map(a => a._id);
    
    // Delete all student assignments for this class's assignments
    await StudentAssignment.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ class: classId });

    // Delete the class
    await Class.findByIdAndDelete(classId);

    res.status(200).json({
      message: 'Class and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Class deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a batch for a class (teachers only)
app.post('/api/batches', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create batches' });
    }

    const { name, classId } = req.body;

    // Validate input
    if (!name || !classId) {
      return res.status(400).json({ message: 'Batch name and class ID are required' });
    }

    // Check if class exists and belongs to the teacher
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate a unique enrollment code
    let enrollmentCode = generateEnrollmentCode();
    let isUnique = false;
    while (!isUnique) {
      const existingBatch = await Batch.findOne({ enrollmentCode });
      if (!existingBatch) {
        isUnique = true;
      } else {
        enrollmentCode = generateEnrollmentCode();
      }
    }

    // Create the batch
    const newBatch = new Batch({
      name,
      class: classId,
      enrollmentCode,
      students: []
    });

    const savedBatch = await newBatch.save();

    res.status(201).json({
      message: 'Batch created successfully',
      batch: savedBatch
    });
  } catch (error) {
    console.error('Batch creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all batches for a class
app.get('/api/classes/:classId/batches', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const batches = await Batch.find({ class: classId });

    res.status(200).json(batches);
  } catch (error) {
    console.error('Fetch batches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a batch (teachers only)
app.put('/api/batches/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update batches' });
    }

    const batchId = req.params.id;
    const { name } = req.body;

    // Find the batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if the class for this batch belongs to the teacher
    const classItem = await Class.findById(batch.class);
    if (!classItem || classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update the batch
    if (name) batch.name = name;
    const updatedBatch = await batch.save();

    res.status(200).json({
      message: 'Batch updated successfully',
      batch: updatedBatch
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a batch (teachers only)
app.delete('/api/batches/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete batches' });
    }

    const batchId = req.params.id;

    // Find the batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if the class for this batch belongs to the teacher
    const classItem = await Class.findById(batch.class);
    if (!classItem || classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the batch
    await Batch.findByIdAndDelete(batchId);

    res.status(200).json({
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('Batch deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student enrollment with code
app.post('/api/batches/enroll', authenticateToken, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in batches' });
    }

    const { enrollmentCode } = req.body;

    // Validate input
    if (!enrollmentCode) {
      return res.status(400).json({ message: 'Enrollment code is required' });
    }

    // Find the batch with the provided code
    const batch = await Batch.findOne({ enrollmentCode });
    if (!batch) {
      return res.status(404).json({ message: 'Invalid enrollment code' });
    }

    // Check if student is already enrolled
    if (batch.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already enrolled in this batch' });
    }

    // Add student to the batch
    batch.students.push(req.user.id);
    await batch.save();

    // Get class to enroll student in all its assignments
    const classItem = await Class.findById(batch.class);
    
    // Find all assignments for this class and create student assignments
    const assignments = await Assignment.find({ class: batch.class });
    
    for (const assignment of assignments) {
      const newStudentAssignment = new StudentAssignment({
        student: req.user.id,
        assignment: assignment._id,
        status: 'assigned'
      });
      await newStudentAssignment.save();
    }

    res.status(200).json({
      message: 'Successfully enrolled in the batch',
      batch: {
        id: batch._id,
        name: batch.name,
        class: batch.class
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all batches a student is enrolled in
app.get('/api/batches/enrolled', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const batches = await Batch.find({ students: req.user.id })
      .populate({
        path: 'class',
        select: 'name subject description',
        populate: {
          path: 'teacher',
          select: 'username email'
        }
      });

    res.status(200).json(batches);
  } catch (error) {
    console.error('Fetch enrolled batches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific batch by ID with assignments
app.get('/api/batches/:id', authenticateToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate({
        path: 'class',
        select: 'name subject description',
        populate: {
          path: 'teacher',
          select: 'username email'
        }
      })
      .populate({
        path: 'students',
        select: 'username email'
      });
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher') {
      // For teachers, check if they own the class this batch belongs to
      const classItem = await Class.findById(batch.class._id);
      if (classItem.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'student') {
      // For students, check if they are enrolled in this batch
      if (!batch.students.some(student => student._id.toString() === req.user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get assignments for this batch's class
    const assignments = await Assignment.find({ class: batch.class._id });
    
    // If student, get their progress for each assignment
    let enrichedAssignments = [...assignments];
    
    if (req.user.role === 'student') {
      const studentAssignments = await StudentAssignment.find({
        student: req.user.id,
        assignment: { $in: assignments.map(a => a._id) }
      });
      
      // Create a map for quick lookup
      const progressMap = {};
      studentAssignments.forEach(sa => {
        progressMap[sa.assignment.toString()] = {
          progress: sa.progress,
          status: sa.status,
          submitted: sa.status === 'completed'
        };
      });
      
      // Enrich assignments with student progress
      enrichedAssignments = assignments.map(assignment => {
        const assignmentObj = assignment.toObject();
        const progress = progressMap[assignment._id.toString()] || {
          progress: 0,
          status: 'assigned',
          submitted: false
        };
        
        return {
          ...assignmentObj,
          ...progress
        };
      });
    }

    // Return batch with assignments and formatted student list
    const batchData = batch.toObject();
    
    // Format student list to include full names
    const studentsList = batchData.students.map(student => ({
      id: student._id,
      name: student.username,
      email: student.email
    }));

    res.status(200).json({
      ...batchData,
      students: studentsList,
      assignments: enrichedAssignments
    });
  } catch (error) {
    console.error('Fetch batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create an assignment for a class (teachers only)
app.post('/api/assignments', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { title, description, classId, modules, language, requirements } = req.body;

    // Validate input
    if (!title || !description || !classId || !modules || !language) {
      return res.status(400).json({ message: 'Title, description, class ID, modules, and language are required' });
    }

    // Check if class exists and belongs to the teacher
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create the assignment
    const newAssignment = new Assignment({
      title,
      description,
      class: classId,
      modules,
      language,
      requirements: requirements || []
    });

    const savedAssignment = await newAssignment.save();

    // Assign to all students in all batches of this class
    const batches = await Batch.find({ class: classId });
    const allStudentIds = new Set();

    for (const batch of batches) {
      for (const studentId of batch.students) {
        allStudentIds.add(studentId.toString());
      }
    }

    // Create student assignment
    const studentAssignmentPromises = Array.from(allStudentIds).map(studentId => {
      const newStudentAssignment = new StudentAssignment({
        student: studentId,
        assignment: savedAssignment._id,
        status: 'assigned'
      });
      return newStudentAssignment.save();
    });

    await Promise.all(studentAssignmentPromises);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: savedAssignment
    });
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assignments for a class
app.get('/api/classes/:classId/assignments', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // For teachers, check if they own the class
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For students, check if they are enrolled in any batch of this class
    if (req.user.role === 'student') {
      const enrolledBatch = await Batch.findOne({
        class: classId,
        students: req.user.id
      });
      
      if (!enrolledBatch) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const assignments = await Assignment.find({ class: classId });

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific assignment by ID with details
app.get('/api/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate({
      path: 'class',
      select: 'name subject description',
      populate: {
        path: 'teacher',
        select: 'username email'
      }
    });
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get the class to check permissions
    const classItem = await Class.findById(assignment.class._id);
    
    // For teachers, check if they own the class
    if (req.user.role === 'teacher' && classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For students, check if they are enrolled in any batch of this class
    if (req.user.role === 'student') {
      const enrolledBatch = await Batch.findOne({
        class: assignment.class._id,
        students: req.user.id
      });
      
      if (!enrolledBatch) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // If teacher, include student submission statistics
    if (req.user.role === 'teacher') {
      // Get all batches for this class
      const batches = await Batch.find({ class: assignment.class._id });
      
      // Get all student IDs across all batches
      const studentIds = batches.reduce((ids, batch) => {
        return [...ids, ...batch.students.map(id => id.toString())];
      }, []);
      
      // Get student assignments for these students
      const studentAssignments = await StudentAssignment.find({
        student: { $in: studentIds },
        assignment: assignment._id
      });
      
      // Calculate statistics
      const stats = {
        totalStudents: studentIds.length,
        submitted: studentAssignments.filter(sa => sa.status === 'completed').length,
        inProgress: studentAssignments.filter(sa => sa.status === 'in-progress').length,
        notStarted: studentAssignments.filter(sa => sa.status === 'assigned').length,
        submissions: studentAssignments
      };
      
      // Add statistics to the response
      const result = assignment.toObject();
      result.stats = stats;
      return res.status(200).json(result);
    }

    res.status(200).json(assignment);
  } catch (error) {
    console.error('Fetch assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an assignment
app.put('/api/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { title, description, language, requirements, modules } = req.body;
    
    const assignment = await Assignment.findById(assignmentId).populate('class');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if the authenticated user is the teacher who created this assignment
    const classItem = await Class.findById(assignment.class._id);
    
    if (!classItem) {
      return res.status(404).json({ message: 'Associated class not found' });
    }
    
    // Only allow teachers who own the class to update the assignment
    if (req.user.role !== 'teacher' || classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }
    
    // Update the assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      {
        title,
        description,
        language,
        requirements,
        modules,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an assignment
app.delete('/api/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    const assignment = await Assignment.findById(assignmentId).populate('class');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if the authenticated user is the teacher who created this assignment
    const classItem = await Class.findById(assignment.class._id);
    
    if (!classItem) {
      return res.status(404).json({ message: 'Associated class not found' });
    }
    
    // Only allow teachers who own the class to delete the assignment
    if (req.user.role !== 'teacher' || classItem.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }
    
    // Delete any student assignments related to this assignment
    await StudentAssignment.deleteMany({ assignment: assignmentId });
    
    // Delete the assignment itself
    await Assignment.findByIdAndDelete(assignmentId);
    
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assignments for a student
app.get('/api/student/assignments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentAssignments = await StudentAssignment.find({ student: req.user.id })
      .populate({
        path: 'assignment',
        populate: {
          path: 'class',
          select: 'name subject',
          populate: {
            path: 'teacher',
            select: 'username'
          }
        }
      });

    res.status(200).json(studentAssignments);
  } catch (error) {
    console.error('Fetch student assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit code for an assignment module
app.post('/api/assignments/:id/submit', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    const { moduleId, code } = req.body;
    const assignmentId = req.params.id;

    // Validate input
    if (!moduleId || !code) {
      return res.status(400).json({ message: 'Module ID and code are required' });
    }

    // Check if the student has this assignment
    let studentAssignment = await StudentAssignment.findOne({
      student: req.user.id,
      assignment: assignmentId
    });

    if (!studentAssignment) {
      return res.status(404).json({ message: 'Assignment not found or not assigned to you' });
    }

    // Update or add the submission
    const submissionIndex = studentAssignment.submissions.findIndex(s => s.moduleId === moduleId);
    
    if (submissionIndex >= 0) {
      studentAssignment.submissions[submissionIndex].code = code;
      studentAssignment.submissions[submissionIndex].submittedAt = new Date();
    } else {
      studentAssignment.submissions.push({
        moduleId,
        code,
        submittedAt: new Date()
      });
    }

    // Update progress
    const assignment = await Assignment.findById(assignmentId);
    const totalModules = assignment.modules.length;
    const completedModules = new Set(studentAssignment.submissions.map(s => s.moduleId)).size;
    studentAssignment.progress = Math.floor((completedModules / totalModules) * 100);

    if (studentAssignment.progress === 100) {
      studentAssignment.status = 'completed';
    } else if (studentAssignment.progress > 0) {
      studentAssignment.status = 'in-progress';
    }

    await studentAssignment.save();

    res.status(200).json({
      message: 'Submission successful',
      progress: studentAssignment.progress,
      status: studentAssignment.status
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark a module as completed
app.post('/api/assignments/:id/modules/:moduleId/complete', authenticateToken, async (req, res) => {
  try {
    console.log('API: Marking module as completed:', req.params);
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can mark modules as completed' });
    }

    const assignmentId = req.params.id;
    const moduleId = Number(req.params.moduleId);

    console.log('Looking for student assignment:', { student: req.user.id, assignment: assignmentId });
    
    // Find the student assignment
    let studentAssignment = await StudentAssignment.findOne({
      student: req.user.id,
      assignment: assignmentId
    });

    console.log('Found student assignment:', studentAssignment ? studentAssignment._id : 'none');

    if (!studentAssignment) {
      // If no student assignment exists yet, create one
      console.log('Creating new student assignment');
      
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      studentAssignment = new StudentAssignment({
        student: req.user.id,
        assignment: assignmentId,
        status: 'in-progress',
        progress: 0,
        submissions: []
      });
    }

    // Check if the submission for this module exists
    const submissionExists = studentAssignment.submissions.some(
      submission => submission.moduleId === moduleId
    );

    // If submission doesn't exist, create it
    if (!submissionExists) {
      studentAssignment.submissions.push({
        moduleId,
        code: req.body.code || '',
        submittedAt: new Date()
      });
      console.log(`Added new submission for module ${moduleId}`);
    } else {
      // Update existing submission
      const submissionIndex = studentAssignment.submissions.findIndex(s => s.moduleId === moduleId);
      if (req.body.code) {
        studentAssignment.submissions[submissionIndex].code = req.body.code;
      }
      studentAssignment.submissions[submissionIndex].submittedAt = new Date();
      console.log(`Updated existing submission for module ${moduleId}`);
    }

    // Get the assignment to calculate progress
    const assignment = await Assignment.findById(assignmentId);
    if (assignment && assignment.modules) {
      const totalModules = assignment.modules.length;
      
      // Get unique completed modules
      const completedModules = new Set(
        studentAssignment.submissions.map(s => s.moduleId)
      );
      
      // Update progress
      studentAssignment.progress = Math.floor((completedModules.size / totalModules) * 100);

      if (studentAssignment.progress === 100) {
        studentAssignment.status = 'completed';
      } else if (studentAssignment.progress > 0) {
        studentAssignment.status = 'in-progress';
      }

      console.log('Updating progress to:', studentAssignment.progress);
    }
    
    await studentAssignment.save();

    // Return completed modules as array
    const completedModuleIds = studentAssignment.submissions.map(sub => sub.moduleId);
    
    res.status(200).json({
      message: 'Module marked as completed',
      completedModules: completedModuleIds,
      progress: studentAssignment.progress,
      status: studentAssignment.status
    });
  } catch (error) {
    console.error('Error marking module as completed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get completed modules for an assignment
app.get('/api/assignments/:id/completed-modules', authenticateToken, async (req, res) => {
  try {
    console.log('API: Fetching completed modules for assignment:', req.params.id);
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignmentId = req.params.id;

    // Find the student assignment
    const studentAssignment = await StudentAssignment.findOne({
      student: req.user.id,
      assignment: assignmentId
    });

    console.log('Found student assignment:', studentAssignment ? studentAssignment._id : 'none');

    if (!studentAssignment) {
      console.log('No student assignment found, returning empty array');
      return res.status(200).json({
        completedModules: [],
        progress: 0,
        status: 'assigned'
      });
    }

    // Extract unique module IDs from submissions
    const completedModules = studentAssignment.submissions.map(submission => submission.moduleId);

    console.log('Completed modules:', completedModules);

    res.status(200).json({
      completedModules,
      progress: studentAssignment.progress,
      status: studentAssignment.status
    });
  } catch (error) {
    console.error('Error fetching completed modules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student can opt out (leave) a batch
app.post('/api/batches/:id/leave', authenticateToken, async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can leave batches' });
    }

    const batchId = req.params.id;

    // Find the batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if student is enrolled in the batch
    if (!batch.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are not enrolled in this batch' });
    }

    // Remove student from the batch
    batch.students = batch.students.filter(
      studentId => studentId.toString() !== req.user.id
    );
    await batch.save();

    // Find and delete all student assignments for this class
    const classId = batch.class;
    const assignments = await Assignment.find({ class: classId });
    const assignmentIds = assignments.map(assignment => assignment._id);

    // Delete student's assignments for this class
    await StudentAssignment.deleteMany({
      student: req.user.id,
      assignment: { $in: assignmentIds }
    });

    res.status(200).json({
      message: 'Successfully left the batch',
      batchId: batch._id
    });
  } catch (error) {
    console.error('Leave batch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher statistics for dashboard
app.get('/api/teacher/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can access these statistics.' });
    }

    // Find all classes taught by this teacher
    const classes = await Class.find({ teacher: req.user.id });
    const classIds = classes.map(c => c._id);
    
    // Find all batches in these classes
    const batches = await Batch.find({ class: { $in: classIds } });
    const totalBatches = batches.length;
    
    // Count unique students across all batches
    const studentSets = new Set();
    batches.forEach(batch => {
      batch.students.forEach(studentId => {
        studentSets.add(studentId.toString());
      });
    });
    const totalStudents = studentSets.size;
    
    // Find all assignments for these classes
    const assignments = await Assignment.find({ class: { $in: classIds } });
    const assignmentIds = assignments.map(a => a._id);
    
    // Find all student assignments for these assignments
    const studentAssignments = await StudentAssignment.find({
      assignment: { $in: assignmentIds }
    });
    
    // Count active assignments (ones that have been started but not completed)
    const activeAssignments = studentAssignments.filter(sa => sa.status === 'in-progress').length;
    
    // Count pending reviews (completed assignments)
    const pendingReviews = studentAssignments.filter(sa => sa.status === 'completed').length;
    
    res.status(200).json({
      totalStudents,
      totalBatches,
      activeAssignments,
      pendingReviews
    });
  } catch (error) {
    console.error('Fetch teacher stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Analytics with caching
app.get('/api/analytics/student', authenticateToken, async (req, res) => {
  try {
    // Verify the user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }

    const studentId = req.user.id;
    const shouldRefresh = req.query.refresh === 'true' || (req.body && req.body.refresh === true);
    
    // Check for cached analytics if no refresh requested
    if (!shouldRefresh) {
      const cachedAnalytics = await AnalyticsCache.findOne({
        userId: studentId,
        role: 'student',
        type: 'performance'
      }).sort({ generatedAt: -1 });
      
      if (cachedAnalytics) {
        // Return cached data with timestamp
        return res.status(200).json({
          ...cachedAnalytics.data,
          cachedAt: cachedAnalytics.generatedAt,
          isCached: true
        });
      }
    }
    
    // No cache found or refresh requested - generate new analytics
    console.log(`Generating fresh analytics for student ${studentId}`);
    
    // Get all student assignments
    const studentAssignments = await StudentAssignment.find({ student: studentId })
      .populate({
        path: 'assignment',
        populate: { path: 'class', select: 'name' }
      });
    
    // Calculate completion time metrics for each module
    const moduleCompletionTimes = [];
    const moduleTimeByAssignment = {};
    const assignmentProgress = {};
    
    // Process all submissions to calculate time metrics
    for (const sa of studentAssignments) {
      if (!sa.submissions || sa.submissions.length === 0) continue;
      
      // Sort submissions by moduleId to ensure chronological order
      const sortedSubmissions = [...sa.submissions].sort((a, b) => a.moduleId - b.moduleId);
      
      // Track the assignment in our progress tracker
      if (!assignmentProgress[sa.assignment._id]) {
        assignmentProgress[sa.assignment._id] = {
          id: sa.assignment._id,
          title: sa.assignment.title,
          className: sa.assignment.class ? sa.assignment.class.name : 'Unknown',
          totalModules: sa.assignment.modules ? sa.assignment.modules.length : 0,
          completedModules: sortedSubmissions.length,
          progress: sa.progress,
          status: sa.status
        };
      }
      
      // Skip if there's only one submission (can't calculate time difference)
      if (sortedSubmissions.length <= 1) continue;
      
      // Calculate time between modules
      for (let i = 1; i < sortedSubmissions.length; i++) {
        const prevSubmission = sortedSubmissions[i-1];
        const currSubmission = sortedSubmissions[i];
        
        // Calculate minutes between submissions
        const prevDate = new Date(prevSubmission.submittedAt);
        const currDate = new Date(currSubmission.submittedAt);
        const minutesTaken = (currDate - prevDate) / (1000 * 60);
        
        // Only count reasonable times (between 1 minute and 3 hours)
        if (minutesTaken >= 1 && minutesTaken <= 180) {
          moduleCompletionTimes.push({
            assignmentId: sa.assignment._id,
            assignmentTitle: sa.assignment.title,
            moduleId: currSubmission.moduleId,
            minutesTaken: minutesTaken,
            submittedAt: currSubmission.submittedAt
          });
          
          // Group by assignment for assignment-level stats
          if (!moduleTimeByAssignment[sa.assignment._id]) {
            moduleTimeByAssignment[sa.assignment._id] = [];
          }
          moduleTimeByAssignment[sa.assignment._id].push(minutesTaken);
        }
      }
    }
    
    // Calculate average completion time per assignment
    const assignmentAvgTimes = {};
    for (const [assignmentId, times] of Object.entries(moduleTimeByAssignment)) {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        assignmentAvgTimes[assignmentId] = {
          avgTimeMinutes: Math.round(avgTime * 10) / 10,
          modulesWithData: times.length
        };
      }
    }
    
    // Get global averages for comparison
    const allStudentAssignments = await StudentAssignment.find({}).lean();
    const globalModuleTimes = {};
    let totalGlobalSubmissions = 0;
    
    for (const sa of allStudentAssignments) {
      if (!sa.submissions || sa.submissions.length <= 1) continue;
      
      const sortedSubmissions = [...sa.submissions].sort((a, b) => a.moduleId - b.moduleId);
      
      for (let i = 1; i < sortedSubmissions.length; i++) {
        const prevSubmission = sortedSubmissions[i-1];
        const currSubmission = sortedSubmissions[i];
        
        const prevDate = new Date(prevSubmission.submittedAt);
        const currDate = new Date(currSubmission.submittedAt);
        const minutesTaken = (currDate - prevDate) / (1000 * 60);
        
        if (minutesTaken >= 1 && minutesTaken <= 180) {
          const moduleKey = `${sa.assignment}-${currSubmission.moduleId}`;
          
          if (!globalModuleTimes[moduleKey]) {
            globalModuleTimes[moduleKey] = { times: [], avg: 0 };
          }
          
          globalModuleTimes[moduleKey].times.push(minutesTaken);
          totalGlobalSubmissions++;
        }
      }
    }
    
    // Calculate global averages
    for (const key in globalModuleTimes) {
      const times = globalModuleTimes[key].times;
      if (times.length > 0) {
        globalModuleTimes[key].avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      }
    }
    
    // Calculate student's average compared to global average
    const comparisonMetrics = [];
    for (const completion of moduleCompletionTimes) {
      const moduleKey = `${completion.assignmentId}-${completion.moduleId}`;
      const globalAvg = globalModuleTimes[moduleKey]?.avg;
      
      if (globalAvg && globalAvg > 0) {
        const percentDifference = ((completion.minutesTaken - globalAvg) / globalAvg) * 100;
        comparisonMetrics.push({
          ...completion,
          globalAvgMinutes: Math.round(globalAvg * 10) / 10,
          percentDifference: Math.round(percentDifference)
        });
      }
    }
    
    // Get recent activity (last 5 submissions)
    const recentActivity = studentAssignments
      .flatMap(sa => sa.submissions || [])
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);
    
    // Calculate learning trends over time (weekly progress)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Create weekly buckets
    const weeklyProgress = {};
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    // Group submissions by week
    for (const sa of studentAssignments) {
      if (!sa.submissions) continue;
      
      for (const submission of sa.submissions) {
        const submissionDate = new Date(submission.submittedAt);
        if (submissionDate < sixMonthsAgo) continue;
        
        // Calculate week number relative to today
        const weekNumber = Math.floor((now - submissionDate) / weekMs);
        const weekLabel = weekNumber === 0 ? 'This week' : 
                         weekNumber === 1 ? 'Last week' : 
                         `${weekNumber} weeks ago`;
        
        if (!weeklyProgress[weekLabel]) {
          weeklyProgress[weekLabel] = {
            count: 0,
            week: weekNumber,
            modules: new Set()
          };
        }
        
        weeklyProgress[weekLabel].count++;
        weeklyProgress[weekLabel].modules.add(`${sa.assignment._id}-${submission.moduleId}`);
      }
    }
    
    // Convert to array and sort by week number
    const learningTrend = Object.entries(weeklyProgress)
      .map(([label, data]) => ({
        label,
        submissionCount: data.count,
        uniqueModulesCompleted: data.modules.size,
        weekNumber: data.week
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber);
    
    // Create analytics result object
    const analyticsData = {
      overview: {
        totalAssignments: studentAssignments.length,
        completedAssignments: studentAssignments.filter(sa => sa.status === 'completed').length,
        inProgressAssignments: studentAssignments.filter(sa => sa.status === 'in-progress').length,
        assignedAssignments: studentAssignments.filter(sa => sa.status === 'assigned').length
      },
      learningSpeed: {
        moduleCompletionTimes,
        assignmentAvgTimes,
        comparisonToGlobalAvg: comparisonMetrics
      },
      progress: Object.values(assignmentProgress),
      recentActivity,
      learningTrend
    };
    
    // Save to cache
    const newCache = new AnalyticsCache({
      userId: studentId,
      role: 'student',
      type: 'performance',
      data: analyticsData
    });
    
    await newCache.save();
    
    // Return the fresh analytics
    res.status(200).json({
      ...analyticsData,
      generatedAt: new Date(),
      isCached: false
    });
  } catch (error) {
    console.error('Student analytics error:', error);
    return handleError(error, res);
  }
});

// Teacher Analytics with caching
app.get('/api/analytics/teacher', authenticateToken, async (req, res) => {
  try {
    // Verify the user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const teacherId = req.user.id;
    const shouldRefresh = req.query.refresh === 'true' || (req.body && req.body.refresh === true);
    // Check for cached analytics if no refresh requested
    if (!shouldRefresh) {
      const cachedAnalytics = await AnalyticsCache.findOne({
        userId: teacherId,
        role: 'teacher',
        type: 'dashboard'
      }).sort({ generatedAt: -1 });
      
      if (cachedAnalytics) {
        // Return cached data with timestamp
        return res.status(200).json({
          ...cachedAnalytics.data,
          cachedAt: cachedAnalytics.generatedAt,
          isCached: true
        });
      }
    }
    
    // No cache found or refresh requested - generate new analytics
    console.log(`Generating fresh analytics for teacher ${teacherId}`);
    
    // Get all classes taught by this teacher
    const classes = await Class.find({ teacher: req.user.id });
    const classIds = classes.map(c => c._id);
    
    // Find all batches in these classes
    const batches = await Batch.find({ class: { $in: classIds } });
    const totalBatches = batches.length;
    
    // Count unique students across all batches
    const studentSets = new Set();
    batches.forEach(batch => {
      batch.students.forEach(studentId => {
        studentSets.add(studentId.toString());
      });
    });
    const totalStudents = studentSets.size;
    
    // Find all assignments for these classes
    const assignments = await Assignment.find({ class: { $in: classIds } });
    const assignmentIds = assignments.map(a => a._id);
    
    // Find all student assignments for these assignments
    const studentAssignments = await StudentAssignment.find({
      assignment: { $in: assignmentIds }
    });
    
    // Count active assignments (ones that have beenstarted but not completed)
    const activeAssignments = studentAssignments.filter(sa => sa.status === 'in-progress').length;
    
    // Count pending reviews (completed assignments)
    const pendingReviews = studentAssignments.filter(sa => sa.status === 'completed').length;
    
    // Batch-level analytics
    const batchAnalytics = {};
    
    // Student enrollment across batches
    const studentEnrollmentMap = {};
    
    // Module completion analytics across all students
    const moduleCompletionTimes = {};
    
    // Process all batches and their students
    for (const batch of batches) {
      const batchId = batch._id.toString();
      batchAnalytics[batchId] = {
        id: batchId,
        name: batch.name,
        className: batch.class.name,
        classSubject: batch.class.subject,
        studentCount: batch.students.length,
        completionRates: {},
        assignmentProgress: {},
        avgCompletionTimes: {}
      };
      
      // Track enrollment for each student
      for (const studentId of batch.students) {
        const sid = studentId.toString();
        if (!studentEnrollmentMap[sid]) {
          studentEnrollmentMap[sid] = [];
        }
        studentEnrollmentMap[sid].push(batchId);
      }
      
      // Get assignments for this batch's class
      const batchAssignments = assignments.filter(a => 
        a.class.toString() === batch.class._id.toString()
      );
      
      // Process assignment statistics for this batch
      for (const assignment of batchAssignments) {
        const assignmentId = assignment._id.toString();
        
        // Find student assignments for this assignment
        const relevantStudentAssignments = studentAssignments.filter(sa => 
          sa.assignment.toString() === assignmentId && 
          batch.students.some(sid => sid.toString() === sa.student._id.toString())
        );
        
        // Calculate completion rates
        const totalStudents = batch.students.length;
        const completedCount = relevantStudentAssignments.filter(sa => sa.status === 'completed').length;
        const inProgressCount = relevantStudentAssignments.filter(sa => sa.status === 'in-progress').length;
        
        batchAnalytics[batchId].completionRates[assignmentId] = {
          assignmentTitle: assignment.title,
          completed: completedCount,
          inProgress: inProgressCount,
          notStarted: totalStudents - completedCount - inProgressCount,
          completionPercentage: totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0
        };
        
        // Calculate average progress
        const avgProgress = relevantStudentAssignments.length > 0 
          ? relevantStudentAssignments.reduce((sum, sa) => sum + sa.progress, 0) / relevantStudentAssignments.length 
          : 0;
        
        batchAnalytics[batchId].assignmentProgress[assignmentId] = {
          assignmentTitle: assignment.title,
          averageProgress: Math.round(avgProgress),
          studentCount: relevantStudentAssignments.length
        };
        
        // Calculate completion times for modules
        for (const sa of relevantStudentAssignments) {
          if (!sa.submissions || sa.submissions.length <= 1) continue;
          
          const sortedSubmissions = [...sa.submissions].sort((a, b) => a.moduleId - b.moduleId);
          
          for (let i = 1; i < sortedSubmissions.length; i++) {
            const prevSubmission = sortedSubmissions[i-1];
            const currSubmission = sortedSubmissions[i];
            
            const prevDate = new Date(prevSubmission.submittedAt);
            const currDate = new Date(currSubmission.submittedAt);
            const minutesTaken = (currDate - prevDate) / (1000 * 60);
            
            // Only count reasonable times (between 1 minute and 3 hours)
            if (minutesTaken >= 1 && minutesTaken <= 180) {
              const moduleKey = `${assignmentId}-${currSubmission.moduleId}`;
              
              if (!moduleCompletionTimes[moduleKey]) {
                moduleCompletionTimes[moduleKey] = {
                  assignmentTitle: assignment.title,
                  moduleId: currSubmission.moduleId,
                  times: [],
                  batches: {}
                };
              }
              
              moduleCompletionTimes[moduleKey].times.push(minutesTaken);
              
              // Track by batch too
              if (!moduleCompletionTimes[moduleKey].batches[batchId]) {
                moduleCompletionTimes[moduleKey].batches[batchId] = [];
              }
              moduleCompletionTimes[moduleKey].batches[batchId].push(minutesTaken);
              
              // Track in batch analytics
              if (!batchAnalytics[batchId].avgCompletionTimes[moduleKey]) {
                batchAnalytics[batchId].avgCompletionTimes[moduleKey] = {
                  assignmentTitle: assignment.title,
                  moduleId: currSubmission.moduleId,
                  times: []
                };
              }
              batchAnalytics[batchId].avgCompletionTimes[moduleKey].times.push(minutesTaken);
            }
          }
        }
      }
    }
    
    // Calculate averages for module completion times
    for (const key in moduleCompletionTimes) {
      const moduleData = moduleCompletionTimes[key];
      
      if (moduleData.times.length > 0) {
        moduleData.averageMinutes = moduleData.times.reduce((sum, time) => sum + time, 0) / moduleData.times.length;
      }
      
      // Calculate batch averages
      moduleData.batchAverages = {};
      for (const batchId in moduleData.batches) {
        const times = moduleData.batches[batchId];
        if (times.length > 0) {
          moduleData.batchAverages[batchId] = times.reduce((sum, time) => sum + time, 0) / times.length;
          
          // Update in batch analytics
          if (batchAnalytics[batchId] && batchAnalytics[batchId].avgCompletionTimes[key]) {
            const batchTimes = batchAnalytics[batchId].avgCompletionTimes[key].times;
            batchAnalytics[batchId].avgCompletionTimes[key].average = 
              batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
          }
        }
      }
    }
    
    // Find fastest learners (students with consistently quick module completion)
    const studentSpeedMap = {};
    
    for (const sa of studentAssignments) {
      if (!sa.submissions || sa.submissions.length <= 1) continue;
      
      const studentId = sa.student._id.toString();
      const studentName = sa.student.username;
      
      if (!studentSpeedMap[studentId]) {
        studentSpeedMap[studentId] = { 
          id: studentId,
          name: studentName,
          moduleTimes: [],
          classAssignments: {}
        };
      }
      
      const sortedSubmissions = [...sa.submissions].sort((a, b) => a.moduleId - b.moduleId);
      
      for (let i = 1; i < sortedSubmissions.length; i++) {
        const prevSubmission = sortedSubmissions[i-1];
        const currSubmission = sortedSubmissions[i];
        
        const prevDate = new Date(prevSubmission.submittedAt);
        const currDate = new Date(currSubmission.submittedAt);
        const minutesTaken = (currDate - prevDate) / (1000 * 60);
        
        // Only count reasonable times (between 1 minute and 3 hours)
        if (minutesTaken >= 1 && minutesTaken <= 180) {
          // Find which class this assignment belongs to
          const assignment = assignments.find(a => a._id.toString() === sa.assignment.toString());
          if (assignment) {
            const classId = assignment.class.toString();
            
            if (!studentSpeedMap[studentId].classAssignments[classId]) {
              studentSpeedMap[studentId].classAssignments[classId] = [];
            }
            
            studentSpeedMap[studentId].moduleTimes.push(minutesTaken);
            studentSpeedMap[studentId].classAssignments[classId].push(minutesTaken);
          }
        }
      }
    }
    
    // Calculate average speed for each student
    const studentLeaderboards = {};
    
    for (const studentId in studentSpeedMap) {
      const student = studentSpeedMap[studentId];
      
      // Calculate overall average
      if (student.moduleTimes.length > 1) {
        student.averageTimeMinutes = student.moduleTimes.reduce((sum, time) => sum + time, 0) / student.moduleTimes.length;
      }
      
      // Calculate class-specific averages
      for (const classId in student.classAssignments) {
        const times = student.classAssignments[classId];
        
        if (times.length > 1) {
          if (!studentLeaderboards[classId]) {
            studentLeaderboards[classId] = [];
          }
          
          const classAvg = times.reduce((sum, time) => sum + time, 0) / times.length;
          
          studentLeaderboards[classId].push({
            studentId,
            name: student.name,
            averageTimeMinutes: classAvg,
            modulesCompleted: times.length
          });
        }
      }
    }
    
    // Sort leaderboards
    for (const classId in studentLeaderboards) {
      studentLeaderboards[classId].sort((a, b) => a.averageTimeMinutes - b.averageTimeMinutes);
      
      // Add rank
      studentLeaderboards[classId] = studentLeaderboards[classId].map((student, index) => ({
        ...student,
        rank: index + 1
      }));
    }
    
    // Calculate batch comparison metrics
    const batchComparison = [];
    for (const batch of batches) {
      const batchId = batch._id.toString();
      const analytics = batchAnalytics[batchId];
      
      // Calculate completion metrics
      let totalCompletionRate = 0;
      let rateCount = 0;
      
      for (const assignmentId in analytics.completionRates) {
        totalCompletionRate += analytics.completionRates[assignmentId].completionPercentage;
        rateCount++;
      }
      
      // Calculate speed metrics
      let totalModuleTime = 0;
      let timeCount = 0;
      
      for (const moduleKey in analytics.avgCompletionTimes) {
        if (analytics.avgCompletionTimes[moduleKey].average) {
          totalModuleTime += analytics.avgCompletionTimes[moduleKey].average;
          timeCount++;
        }
      }
      
      // Add to comparison
      batchComparison.push({
        batchId,
        batchName: batch.name,
        className: batch.class.name,
        studentCount: batch.students.length,
        avgCompletionRate: rateCount > 0 ? totalCompletionRate / rateCount : 0,
        avgModuleTimeMinutes: timeCount > 0 ? totalModuleTime / timeCount : 0
      });
    }
    
    // Return comprehensive teacher analytics
    res.status(200).json({
      overview: {
        totalClasses: classes.length,
        totalBatches: batches.length,
        totalAssignments: assignments.length,
        totalStudents: Object.keys(studentEnrollmentMap).length
      },
      batchAnalytics: Object.values(batchAnalytics),
      moduleAnalytics: moduleCompletionTimes,
      studentLeaderboards,
      batchComparison
    });
  } catch (error) {
    console.error('Teacher analytics error:', error);
    return handleError(error, res);
  }
});

// Admin Analytics with caching
app.get('/api/analytics/admin', authenticateToken, async (req, res) => {
  try {
    // Verify user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    const adminId = req.user.id;
    const shouldRefresh = req.query.refresh === 'true' || (req.body && req.body.refresh === true);
    // Check for cached analytics if no refresh requested
    if (!shouldRefresh) {
      const cachedAnalytics = await AnalyticsCache.findOne({
        userId: adminId,
        role: 'admin',
        type: 'platform'
      }).sort({ generatedAt: -1 });
      
      if (cachedAnalytics && (new Date() - cachedAnalytics.generatedAt) < (24 * 60 * 60 * 1000)) {
        // Use cache if it's less than 24 hours old
        return res.status(200).json({
          ...cachedAnalytics.data,
          cachedAt: cachedAnalytics.generatedAt,
          isCached: true
        });
      }
    }
    
    // No cache found or refresh requested - generate new analytics
    console.log(`Generating fresh analytics for admin ${adminId}`);
    
    // Get total number of students
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Get total number of teachers
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    
    // Get total number of classes
    const totalClasses = await Class.countDocuments();
    
    // Get total number of batches
    const totalBatches = await Batch.countDocuments();
    
    // Get total number of assignments
    const totalAssignments = await Assignment.countDocuments();
    
    // Get registrations in the last 30 days
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    
    const recentRegistrations = await User.find({
      createdAt: { $gte: dateFrom }
    }).select('role createdAt');
    
    // Count by role
    const registrationsByRole = recentRegistrations.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Monthly growth for the last 6 months
    const monthlyGrowth = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - i);
      month.setDate(1);
      
      const nextMonth = new Date(month);
      nextMonth.setMonth(month.getMonth() + 1);
      
      const studentCount = await User.countDocuments({
        role: 'student',
        createdAt: { $gte: month, $lt: nextMonth }
      });
      
      const teacherCount = await User.countDocuments({
        role: 'teacher',
        createdAt: { $gte: month, $lt: nextMonth }
      });
      
      monthlyGrowth.push({
        month: month.toLocaleString('default', { month: 'long', year: 'numeric' }),
        studentCount,
        teacherCount
      });
    }
    
    // Submission activity in the last 30 days
    const dateFromActivity = new Date();
    dateFromActivity.setDate(dateFromActivity.getDate() - 30);
    
    const submissionActivity = await StudentAssignment.find({
      createdAt: { $gte: dateFromActivity }
    }).populate('assignment', 'title').populate('student', 'username');
    
    // Subject-wise metrics
    const subjectMetrics = {};
    
    // Get all classes with their subjects
    const classes = await Class.find().populate('teacher', 'username');
    
    // For each class, get the assignments and their average completion time
    for (const classItem of classes) {
      const assignments = await Assignment.find({ class: classItem._id });
      const assignmentIds = assignments.map(a => a._id);
      
      // Get all student assignments for these assignments
      const studentAssignments = await StudentAssignment.find({
        assignment: { $in: assignmentIds }
      });
      
      // Calculate average completion time for each assignment
      for (const assignment of assignments) {
        const relevantStudentAssignments = studentAssignments.filter(sa => 
          sa.assignment.toString() === assignment._id.toString()
        );
        
        if (relevantStudentAssignments.length > 0) {
          const avgTime = relevantStudentAssignments.reduce((sum, sa) => sum + sa.progress, 0) / relevantStudentAssignments.length;
          subjectMetrics[classItem.subject] = subjectMetrics[classItem.subject] || { total: 0, count: 0 };
          subjectMetrics[classItem.subject].total += avgTime;
          subjectMetrics[classItem.subject].count += relevantStudentAssignments.length;
        }
      }
    }
    
    // Calculate overall average for each subject
    for (const subject in subjectMetrics) {
      subjectMetrics[subject].average = subjectMetrics[subject].total / subjectMetrics[subject].count;
    }
    
    // Teacher performance based on student count and assignment completion
    const teacherPerformance = await User.aggregate([
      { $match: { role: 'teacher' } },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'teacher',
          as: 'classes'
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'classes._id',
          foreignField: 'class',
          as: 'batches'
        }
      },
      {
        $lookup: {
          from: 'studentassignments',
          localField: 'batches.students',
          foreignField: 'student',
          as: 'studentAssignments'
        }
      },
      {
        $group: {
          _id: '$_id',
          username: { $first: '$username' },
          totalStudents: { $sum: { $size: '$batches.students' } },
          totalAssignments: { $sum: { $size: '$studentAssignments' } }
        }
      }
    ]);
    
    // Create analytics result object
    const analyticsData = {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalBatches,
        totalAssignments,
        recentRegistrations: registrationsByRole
      },
      growth: {
        monthlyGrowth
      },
      engagement: {
        recentActivity: submissionActivity,
        subjectMetrics
      },
      teacherPerformance: teacherPerformance.sort((a, b) => b.studentCount - a.studentCount)
    };
    
    // Save to cache
    const newCache = new AnalyticsCache({
      userId: adminId,
      role: 'admin',
      type: 'platform',
      data: analyticsData
    });
    
    await newCache.save();
    
    // Return the fresh analytics
    res.status(200).json({
      ...analyticsData,
      generatedAt: new Date(),
      isCached: false
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return handleError(error, res);
  }
});

// Clear analytics cache (admin only)
app.delete('/api/analytics/cache', authenticateToken, async (req, res) => {
  try {
    // Only admins can clear all cache
    if (req.user.role !== 'admin' && !req.query.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If userId specified, verify it's the current user or admin
    if (req.query.userId && req.query.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const filter = {};
    
    // Filter by user if specified
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    // Filter by role if specified
    if (req.query.role && ['student', 'teacher', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    
    // Filter by type if specified
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    const result = await AnalyticsCache.deleteMany(filter);
    
    res.status(200).json({
      message: 'Analytics cache cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return handleError(error, res);
  }
});

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the User API');
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});