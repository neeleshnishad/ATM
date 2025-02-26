const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const app = express();

// Ensure 'uploads' folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("'uploads' folder created!");
}

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/atmDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected successfully!"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    pin: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },
    photo: { type: String },
    documents: [{ type: String }],
});
const User = mongoose.model("User", userSchema);

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

// Routes
app.post("/set-pin", upload.fields([{ name: "photo" }, { name: "documents" }]), async (req, res) => {
    const { pin, name } = req.body;
    const photo = req.files?.photo ? req.files.photo[0].filename : null;
    const documents = req.files?.documents ? req.files.documents.map(doc => doc.filename) : [];

    console.log(`Setting PIN: ${pin}, Name: ${name}, Photo: ${photo}, Docs: ${documents}`);
    try {
        const existingUser = await User.findOne({ pin });
        if (existingUser) {
            console.log(`PIN ${pin} already exists`);
            return res.json({ success: false, message: "PIN already taken" });
        }
        const newUser = new User({ pin, name, balance: 0, photo, documents });
        await newUser.save();
        console.log(`User created with PIN: ${pin}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error in /set-pin:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/validate-pin", async (req, res) => {
    const { pin } = req.query;
    console.log(`Validating PIN: ${pin}`);
    try {
        const user = await User.findOne({ pin });
        if (user) {
            console.log(`PIN ${pin} validated successfully`);
            res.json({ success: true, name: user.name, photo: user.photo ? `/uploads/${user.photo}` : null });
        } else {
            console.log(`PIN ${pin} not found`);
            res.json({ success: false });
        }
    } catch (error) {
        console.error("Error in /validate-pin:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/check-balance", async (req, res) => {
    const { pin } = req.query;
    console.log(`Checking balance for PIN: ${pin}`);
    try {
        const user = await User.findOne({ pin });
        if (user) {
            console.log(`Balance for PIN ${pin}: ${user.balance}`);
            res.json({ success: true, balance: user.balance });
        } else {
            console.log(`User with PIN ${pin} not found`);
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error in /check-balance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/update-balance", async (req, res) => {
    const { pin, amount, isDeposit } = req.body;
    console.log(`Updating balance for PIN: ${pin}, Amount: ${amount}, isDeposit: ${isDeposit}`);
    try {
        const user = await User.findOne({ pin });
        if (!user) {
            console.log(`User with PIN ${pin} not found`);
            return res.json({ success: false, message: "User not found" });
        }
        if (isDeposit) {
            user.balance += amount;
            console.log(`Deposited ${amount}. New balance: ${user.balance}`);
        } else {
            if (user.balance >= amount) {
                user.balance -= amount;
                console.log(`Withdrawn ${amount}. New balance: ${user.balance}`);
            } else {
                console.log(`Insufficient balance for PIN ${pin}`);
                return res.json({ success: false, message: "Insufficient balance" });
            }
        }
        await user.save();
        res.json({ success: true, newBalance: user.balance });
    } catch (error) {
        console.error("Error in /update-balance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Start Server
app.listen(3000, () => console.log("Server running on port 3000"));