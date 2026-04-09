require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- MongoDB Schema --------------------
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true, match: /^\d{10}$/ },
  submittedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// -------------------- In-memory fallback (if MongoDB fails) --------------------
let memoryStore = [];
let useMongoDB = true;

// Connect to MongoDB with retry logic
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ No MONGODB_URI found. Using in-memory storage.');
    useMongoDB = false;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    useMongoDB = true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Falling back to in-memory storage');
    useMongoDB = false;
  }
};

connectDB();

// -------------------- API Route to save contact --------------------
app.post('/api/contact', async (req, res) => {
  const { name, mobile } = req.body;

  // Validate
  if (!name || !mobile) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400). json({ success: false, message: 'Mobile must be 10 digits' });
  }

  try {
    if (useMongoDB) {
      // Save to MongoDB
      const newContact = new Contact({ name, mobile });
      await newContact.save();
      console.log(`Saved to MongoDB: ${name} - ${mobile}`);
      return res.status(201).json({ success: true, message: 'Contact saved successfully!' });
    } else {
      // Save to in-memory array (fallback)
      const newContact = { id: Date.now(), name, mobile, submittedAt: new Date() };
      memoryStore.push(newContact);
      console.log(`Saved to memory (fallback): ${name} - ${mobile}`);
      return res.status(201).json({ success: true, message: 'Contact saved (offline mode).' });
    }
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Optional: Route to view all contacts (for testing)
app.get('/api/contacts', (req, res) => {
  if (useMongoDB) {
    Contact.find().then(contacts => res.json(contacts)).catch(err => res.status(500).json({ error: err.message }));
  } else {
    res.json(memoryStore);
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Storage mode: ${useMongoDB ? 'MongoDB' : 'In-memory (data lost on restart)'}`);
});
