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
    const { title, description } = req.body;
    const course = await Course.create({ title, description });
    res.status(201).json(course);
};

module.exports = { getCourses, getCourseById, createCourse };
