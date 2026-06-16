const Certificate = require('../models/certificateModel');

const getCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;
        const certificate = await Certificate.findOne({ certificateId })
            .populate('user', 'name')
            .populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ message: 'الشهادة غير موجودة أو غير صالحة' });
        }

        res.json({
            certificateId: certificate.certificateId,
            studentName: certificate.user.name,
            courseTitle: certificate.course.title,
            issueDate: certificate.issueDate,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCertificate };
