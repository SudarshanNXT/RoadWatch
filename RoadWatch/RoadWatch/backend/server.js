require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Complaint = require('./models/Complaint');
const Admin = require('./models/Admin');
const Alert = require('./models/Alert');
const sendEmail = require('./utils/sendEmail');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const generateId = () => crypto.randomBytes(4).toString('hex').toUpperCase();

// --- AUTHENTICATION API --- //
app.post('/api/admin/signup', async (req, res) => {
  try {
    const { email, deptId, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, deptId, password: hashedPassword });
    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email: admin.email, deptId: admin.deptId }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1d' });
    res.json({ token, admin: { email: admin.email, deptId: admin.deptId } });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin JWT Middleware
const verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'supersecretjwtkey123');
    req.admin = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// --- COMPLAINTS API --- //
// User submit complaint (Supports image upload via multer)
app.post('/api/complaints', upload.single('image'), async (req, res) => {
  try {
    const { name, email, description, locationDesc, location: locStr, ai_result: aiStr } = req.body;
    
    // Parse strings back to object (because formData sends strings)
    // Parse strings back to object (because formData sends strings)
    let location = null;
    let ai_result = null;
    try { location = locStr && locStr !== "undefined" ? JSON.parse(locStr) : null; } catch(e){}
    try { ai_result = aiStr && aiStr !== "undefined" ? JSON.parse(aiStr) : null; } catch(e){}
    
    // Deduplication Check
    if (location && location.lat && location.lng) {
      const activeComplaints = await Complaint.find({ status: { $in: ['open', 'in progress'] } });
      const R = 6371e3; // Earth radius meters
      const lat1 = parseFloat(location.lat) * Math.PI/180;
      for (const c of activeComplaints) {
        if (c.location && c.location.lat && c.location.lng) {
          const lat2 = parseFloat(c.location.lat) * Math.PI/180;
          const dLat = (parseFloat(c.location.lat) - parseFloat(location.lat)) * Math.PI/180;
          const dLon = (parseFloat(c.location.lng) - parseFloat(location.lng)) * Math.PI/180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
          if (distance <= 50) {
            return res.status(409).json({ error: 'A very similar complaint already exists within 50 meters of this exact location.', duplicateId: c.complaintId });
          }
        }
      }
    }
    
    // Create local server URL for the uploaded file
    const imageUrl = req.file ? `http://localhost:5001/uploads/${req.file.filename}` : '';

    const complaintId = `RW-${generateId()}`;

    const newComplaint = new Complaint({
      complaintId,
      name,
      email,
      description,
      locationDesc,
      location,
      imageUrl,
      aiAnalysis: {
        damage_score: ai_result?.final_score || 0,
        severity: ai_result?.severity || 'unknown'
      },
      status: 'open'
    });

    await newComplaint.save();

    const subject = `Your RoadWatch Report (${complaintId}) has been received`;
    const message = `Hello ${name},\n\nThank you for reporting the road issue. Here are your report details:\nReport ID: ${complaintId}\nLocation: ${locationDesc || (location ? location.lat + ', ' + location.lng : 'Unknown')}\nDescription: ${description}\nAI Severity: ${ai_result?.severity?.toUpperCase() || 'Unknown'} (Score: ${ai_result?.final_score || 0})\nStatus: Open\n\nWe will notify you of any updates.\n\nBest regards,\nRoadWatch Team`;
    
    await sendEmail(email, subject, message);

    res.status(201).json({ message: 'Complaint filed successfully', complaint: newComplaint });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeComplaints = complaints.filter(c => {
      if (c.status === 'resolved' && c.resolvedAt) {
        return new Date(c.resolvedAt) >= thirtyDaysAgo;
      }
      return true;
    });

    res.json(activeComplaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin patch status
app.patch('/api/complaints/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status, adminComments } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.id },
      { 
        status, 
        adminComments,
        resolvedAt: status === 'resolved' ? new Date() : null 
      },
      { new: true }
    );
    
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    const subject = `Update on your RoadWatch Report (${complaint.complaintId})`;
    let message = `Hello ${complaint.name},\n\nThe status of your report (${complaint.complaintId}) has been updated to: ${status.toUpperCase()}.`;
    if (adminComments) {
      message += `\n\nAdmin Comments: ${adminComments}`;
    }
    message += `\n\nBest regards,\nRoadWatch Team`;
    await sendEmail(complaint.email, subject, message);

    res.json(complaint);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});
// --- TRACKING & ALERTS & RECHECK API --- //
app.get('/api/complaints/track/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });
    if (!complaint) return res.status(404).json({ error: 'Tracking ID not found.' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Server error tracking complaint' });
  }
});

// Admin re-check AI
app.post('/api/complaints/:id/recheck', verifyAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });
    if (!complaint.imageUrl) return res.status(400).json({ error: 'No image attached to this complaint to recheck.' });

    // Extract filename from URL
    const fs = require('fs');
    const axios = require('axios');
    const FormData = require('form-data');
    const parts = complaint.imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const localFilePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(localFilePath)) return res.status(400).json({ error: 'Image file no longer exists locally.' });

    const formData = new FormData();
    formData.append('image', fs.createReadStream(localFilePath));

    const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
      headers: formData.getHeaders()
    });

    const aiData = response.data;
    complaint.aiAnalysis = {
      damage_score: aiData.final_score || 0,
      severity: aiData.severity || complaint.aiAnalysis.severity
    };
    await complaint.save();
    res.json({ message: 'AI Recheck Complete', aiAnalysis: complaint.aiAnalysis });
  } catch(error) {
    console.error('Recheck error', error);
    res.status(500).json({ error: 'Server Error during AI Recheck' });
  }
});

app.post('/api/alerts', verifyAdmin, async (req, res) => {
  try {
    const { message, type } = req.body;
    const newAlert = new Alert({ message, type });
    await newAlert.save();
    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alert.' });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

app.delete('/api/alerts/:id', verifyAdmin, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
