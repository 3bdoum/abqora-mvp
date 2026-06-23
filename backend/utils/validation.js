const mongoose = require('mongoose');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const cleanText = (value, maxLength = 500) => (
    typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const isSafeExternalUrl = (value, allowedHosts = []) => {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return false;
        return allowedHosts.length === 0 || allowedHosts.some(
            (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
        );
    } catch {
        return false;
    }
};

const isStudentActivityUrl = (value) => (
    isSafeExternalUrl(value, ['code.org'])
    && !/\/(?:teacher(?:-panel)?|sections?|manage|dashboard|levelbuilder)(?:[-_/]|$)/i.test(value)
    && !/[?&](?:viewAs|user_id|section_id)=/i.test(value)
);

module.exports = { isObjectId, cleanText, isSafeExternalUrl, isStudentActivityUrl };
