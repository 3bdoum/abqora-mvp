const Course = require('../models/courseModel');
const Progress = require('../models/progressModel');
const { getLessonState, serializeCourseProgress } = require('../utils/progressAccess');
const { isObjectId, cleanText, isStudentActivityUrl } = require('../utils/validation');

const findCourses = () => Course.find({ published: { $ne: false } }).populate({
    path: 'lessons',
    options: { sort: { order: 1 } }
});

const getCourses = async (req, res) => {
    try {
        const courses = await findCourses();
        const progressByCourse = new Map();

        if (req.user?.role === 'student') {
            const progressList = await Progress.find({
                user: req.user._id,
                course: { $in: courses.map((course) => course._id) }
            });
            progressList.forEach((progress) => progressByCourse.set(String(progress.course), progress));
        }

        res.json(courses.map((course) => {
            const progress = progressByCourse.get(String(course._id));
            return {
                ...course.toObject(),
                lessons: course.lessons.map((lesson) => ({
                    _id: lesson._id,
                    stableId: lesson.stableId,
                    title: lesson.title,
                    order: lesson.order,
                    type: lesson.type,
                    isPlaceholder: lesson.isPlaceholder,
                })),
                lessonCount: course.lessons.length,
                progress: serializeCourseProgress(course, progress),
            };
        }));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCourseById = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'معرّف الدورة غير صالح' });
        }

        const course = await Course.findById(req.params.id).populate({
            path: 'lessons',
            options: { sort: { order: 1 } }
        });
        if (!course || course.published === false) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        let progress = null;
        if (req.user.role === 'student') {
            progress = await Progress.findOne({ user: req.user._id, course: course._id });
        }

        const lessons = course.lessons.map((lesson) => {
            const studentState = req.user.role === 'student'
                ? getLessonState({ lessons: course.lessons, lesson, progress })
                : 'available';
            const data = { ...lesson.toObject(), studentState };
            if (req.user.role === 'student' && studentState === 'locked') {
                data.content = '';
                data.videoUrl = '';
                data.videoUrls = [];
                data.codeOrgLink = '';
            }
            return data;
        });

        return res.json({
            ...course.toObject(),
            lessons,
            lessonCount: lessons.length,
            progress: serializeCourseProgress(course, progress),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const enrollInCourse = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'التسجيل في الدورة متاح للطلاب فقط' });
        }
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'معرّف الدورة غير صالح' });
        }

        const course = await Course.findOne({ _id: req.params.id, published: { $ne: false } });
        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });

        const progress = await Progress.findOneAndUpdate(
            { user: req.user._id, course: course._id },
            { $setOnInsert: { enrolledAt: new Date(), completedLessons: [], lessonProgress: [] } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.status(201).json({ message: 'تم التسجيل في الدورة', progress });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح للقيام بهذا الإجراء' });
        }

        const title = cleanText(req.body.title, 160);
        const description = cleanText(req.body.description, 1200);
        if (!title || !description) {
            return res.status(400).json({ message: 'العنوان والوصف حقول مطلوبة' });
        }

        const referenceUrl = cleanText(req.body.referenceUrl, 500);
        if (referenceUrl && !isStudentActivityUrl(referenceUrl)) {
            return res.status(400).json({ message: 'رابط الدورة الخارجي غير آمن أو غير مخصص للطلاب' });
        }

        const course = await Course.create({ title, description, referenceUrl });
        return res.status(201).json(course);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getCourses, getCourseById, enrollInCourse, createCourse };
