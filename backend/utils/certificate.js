const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateCertificate = ({ studentName, courseTitle, certificateId, outputFile }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(outputFile));

    doc.fontSize(22).text('شهادة اتمام دورة', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`تُمنح هذه الشهادة لـ ${studentName}`, { align: 'center' });
    doc.moveDown();
    doc.text(`بعد إتمام دورة: ${courseTitle}`, { align: 'center' });
    doc.moveDown();
    doc.text(`تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}`, { align: 'center' });
    doc.moveDown();
    doc.text(`رقم الشهادة: ${certificateId}`, { align: 'center' });

    doc.end();
};

module.exports = { generateCertificate };
