const Advertisement = require('../models/advertisementModel');
const { cleanText, isObjectId, isSafeExternalUrl } = require('../utils/validation');

const allowedAudiences = ['all', 'students', 'parents', 'teachers'];

const isSafeAdHref = (href) => {
    if (!href) return true;
    if (href.startsWith('/') && !href.startsWith('//')) return true;
    return isSafeExternalUrl(href);
};

const parseDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'invalid' : date;
};

const sanitizeAdInput = (body) => {
    const badge = cleanText(body.badge, 40);
    const title = cleanText(body.title, 120);
    const description = cleanText(body.description, 320);
    const icon = cleanText(body.icon, 8) || '📣';
    const ctaLabel = cleanText(body.ctaLabel, 60);
    const ctaHref = cleanText(body.ctaHref, 300);
    const audience = cleanText(body.audience, 30) || 'all';
    const active = typeof body.active === 'boolean' ? body.active : body.active !== 'false';
    const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 1;
    const startsAt = parseDateValue(body.startsAt);
    const endsAt = parseDateValue(body.endsAt);

    if (!title || !description) {
        return { error: 'عنوان الإعلان ووصفه مطلوبان' };
    }
    if (!allowedAudiences.includes(audience)) {
        return { error: 'الجمهور المحدد للإعلان غير صالح' };
    }
    if (!isSafeAdHref(ctaHref)) {
        return { error: 'رابط الإعلان يجب أن يكون مسارًا داخليًا أو رابط HTTPS آمن' };
    }
    if (startsAt === 'invalid' || endsAt === 'invalid') {
        return { error: 'تاريخ الإعلان غير صالح' };
    }
    if (startsAt && endsAt && startsAt > endsAt) {
        return { error: 'تاريخ بداية الإعلان يجب أن يكون قبل تاريخ النهاية' };
    }

    return {
        data: {
            placement: 'home',
            badge,
            title,
            description,
            icon,
            ctaLabel,
            ctaHref,
            audience,
            active,
            order,
            startsAt,
            endsAt,
        },
    };
};

const serializeAd = (ad) => ({
    _id: ad._id,
    placement: ad.placement,
    badge: ad.badge,
    title: ad.title,
    description: ad.description,
    icon: ad.icon,
    ctaLabel: ad.ctaLabel,
    ctaHref: ad.ctaHref,
    audience: ad.audience,
    active: ad.active,
    order: ad.order,
    startsAt: ad.startsAt,
    endsAt: ad.endsAt,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
});

const getPublicHomeAds = async (req, res) => {
    try {
        const now = new Date();
        const ads = await Advertisement.find({
            placement: 'home',
            active: true,
            $and: [
                { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
                { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
            ],
        }).sort({ order: 1, createdAt: -1 }).limit(6);

        return res.json(ads.map(serializeAd));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const listAds = async (req, res) => {
    try {
        const ads = await Advertisement.find({ placement: 'home' }).sort({ order: 1, createdAt: -1 });
        return res.json(ads.map(serializeAd));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createAd = async (req, res) => {
    try {
        const parsed = sanitizeAdInput(req.body);
        if (parsed.error) return res.status(400).json({ message: parsed.error });

        const ad = await Advertisement.create({
            ...parsed.data,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        });
        return res.status(201).json(serializeAd(ad));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateAd = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'معرّف الإعلان غير صالح' });
        }

        const parsed = sanitizeAdInput(req.body);
        if (parsed.error) return res.status(400).json({ message: parsed.error });

        const ad = await Advertisement.findByIdAndUpdate(
            req.params.id,
            { ...parsed.data, updatedBy: req.user._id },
            { new: true }
        );
        if (!ad) return res.status(404).json({ message: 'الإعلان غير موجود' });
        return res.json(serializeAd(ad));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteAd = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'معرّف الإعلان غير صالح' });
        }
        const ad = await Advertisement.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ message: 'الإعلان غير موجود' });
        return res.json({ message: 'تم حذف الإعلان' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPublicHomeAds,
    listAds,
    createAd,
    updateAd,
    deleteAd,
};
