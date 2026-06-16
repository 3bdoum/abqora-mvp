const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');

const getCourses = async (req, res) => {
    const courses = await Course.find().populate('lessons');
    res.json(courses);
};

const getCourseById = async (req, res) => {
    const course = await Course.findById(req.params.id).populate('lessons');
    if (!course) {
        return res.status(404).json({ message: 'الدورة غير موجودة' });
    }
    res.json(course);
};

const createCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح للقيام بهذا الإجراء' });
        }

        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'العنوان والوصف حقول مطلوبة' });
        }

        const course = await Course.create({ title, description });
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCourses, getCourseById, createCourse };
