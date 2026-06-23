const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');
const Progress = require('../models/progressModel');
const { getLessonState, getOrCreateLessonProgress } = require('../utils/progressAccess');
const { isObjectId, cleanText, isStudentActivityUrl, isSafeExternalUrl } = require('../utils/validation');

const getLessonsByCourse = async (req, res) => {
    try {
        if (!isObjectId(req.params.courseId)) {
            return res.status(400).json({ message: 'معرّف الدورة غير صالح' });
        }
        const lessons = await Lesson.find({ course: req.params.courseId }).sort('order');
        let progress = null;
        if (req.user.role === 'student') {
            progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId });
        }
        return res.json(lessons.map((lesson) => {
            const studentState = req.user.role === 'student'
                ? getLessonState({ lessons, lesson, progress })
                : 'available';
            const data = { ...lesson.toObject(), studentState };
            if (req.user.role === 'student' && studentState === 'locked') {
                data.content = '';
                data.videoUrl = '';
                data.codeOrgLink = '';
                data.nativeActivity = undefined;
            }
            return data;
        }));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getLessonById = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'معرّف الدرس غير صالح' });
        }

        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });

        let studentState = 'available';
        if (req.user.role === 'student') {
            const [lessons, progress] = await Promise.all([
                Lesson.find({ course: lesson.course }).sort('order'),
                Progress.findOne({ user: req.user._id, course: lesson.course }),
            ]);
            studentState = getLessonState({ lessons, lesson, progress });
            if (studentState === 'locked') {
                return res.status(403).json({
                    message: progress
                        ? 'هذا الدرس مقفل. أكمل الدرس السابق أو اطلب من معلمك فتحه.'
                        : 'سجّل في الدورة أولاً للوصول إلى الدرس.'
                });
            }

            if (studentState === 'available') {
                const entry = getOrCreateLessonProgress(progress, lesson._id);
                entry.status = 'in_progress';
                entry.updatedAt = new Date();
                await progress.save();
                studentState = 'in_progress';
            }
        } else if (!['teacher', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'غير مصرح للوصول إلى هذا الدرس' });
        }

        return res.json({ ...lesson.toObject(), studentState });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createLesson = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح للقيام بهذا الإجراء' });
        }

        const title = cleanText(req.body.title, 180);
        const content = cleanText(req.body.content, 4000);
        const { course } = req.body;
        const order = Number(req.body.order);
        if (!title || !content || !isObjectId(course) || !Number.isInteger(order) || order < 1) {
            return res.status(400).json({ message: 'بيانات الدرس غير صالحة' });
        }

        const courseDoc = await Course.findById(course);
        if (!courseDoc) return res.status(404).json({ message: 'الدورة المحددة غير موجودة' });

        const codeOrgLink = cleanText(req.body.codeOrgLink, 500);
        const videoUrl = cleanText(req.body.videoUrl, 500);
        if (codeOrgLink && !isStudentActivityUrl(codeOrgLink)) {
            return res.status(400).json({ message: 'رابط النشاط غير آمن أو غير مخصص للطلاب' });
        }
        if (videoUrl && !isSafeExternalUrl(videoUrl, ['youtube.com', 'youtu.be'])) {
            return res.status(400).json({ message: 'رابط الفيديو غير صالح' });
        }

        const lesson = await Lesson.create({
            stableId: `${courseDoc.slug || courseDoc._id}-l${String(order).padStart(2, '0')}`,
            title,
            content,
            videoUrl,
            codeOrgLink,
            course,
            order,
            type: req.body.type || 'activity',
            requiresApproval: req.body.requiresApproval !== false,
        });

        courseDoc.lessons.addToSet(lesson._id);
        await courseDoc.save();
        return res.status(201).json(lesson);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'يوجد درس بهذا الترتيب بالفعل' });
        }
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getLessonsByCourse, getLessonById, createLesson };
