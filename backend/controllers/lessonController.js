const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');

const getLessonsByCourse = async (req, res) => {
    try {
        const lessons = await Lesson.find({ course: req.params.courseId }).sort('order');
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'الدرس غير موجود' });
        }
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLesson = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح للقيام بهذا الإجراء' });
        }

        const { title, content, videoUrl, codeOrgLink, course, order } = req.body;
        if (!title || !content || !course) {
            return res.status(400).json({ message: 'العنوان والمحتوى والدورة حقول مطلوبة' });
        }

        const courseDoc = await Course.findById(course);
        if (!courseDoc) {
            return res.status(404).json({ message: 'الدورة المحددة غير موجودة' });
        }

        const lesson = await Lesson.create({
            title,
            content,
            videoUrl,
            codeOrgLink,
            course,
            order: order || 0
        });

        // Add lesson ID to parent course's lessons list
        courseDoc.lessons.push(lesson._id);
        await courseDoc.save();

        res.status(201).json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLessonsByCourse, getLessonById, createLesson };
