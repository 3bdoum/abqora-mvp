const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { getJwtSecret } = require('../config/auth');

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, ageGroup } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'كل الحقول مطلوبة' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const publicRole = role || 'student';
        if (!['student', 'parent'].includes(publicRole)) {
            return res.status(400).json({ message: 'نوع الحساب غير صالح للتسجيل العام' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: publicRole,
            ageGroup: publicRole === 'student' ? (ageGroup || 'none') : 'none',
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ageGroup: user.ageGroup,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'بيانات تسجيل الدخول غير صحيحة' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ageGroup: user.ageGroup,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const currentUser = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password').populate('children');
    res.json(user);
};

const linkStudent = async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'هذا الإجراء متاح لحسابات أولياء الأمور فقط' });
        }

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'البريد الإلكتروني للطالب مطلوب' });
        }

        const student = await User.findOne({ email: email.toLowerCase(), role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'الطالب غير موجود' });
        }

        // Check if student is already linked to this parent
        const parent = await User.findById(req.user.id);
        if (parent.children.some((childId) => childId.toString() === student._id.toString())) {
            return res.status(400).json({ message: 'هذا الطالب مضاف بالفعل' });
        }

        parent.children.push(student._id);
        await parent.save();

        student.parent = parent._id;
        await student.save();

        res.json({ message: 'تم ربط الطالب بنجاح', children: parent.children });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLinkedStudents = async (req, res) => {
    try {
        const parent = await User.findById(req.user.id).populate({
            path: 'children',
            select: 'name email ageGroup'
        });
        res.json(parent.children || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, currentUser, linkStudent, getLinkedStudents };
