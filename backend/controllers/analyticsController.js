const crypto = require('crypto');
const PublicAnalyticsEvent = require('../models/publicAnalyticsEventModel');
const AiPublicConversation = require('../models/aiPublicConversationModel');
const SupportRequest = require('../models/supportRequestModel');
const { cleanText } = require('../utils/validation');

const allowedEvents = new Set([
    'page_view',
    'service_click',
    'official_link_click',
    'calculator_used',
    'analysis_track_selected',
    'ai_open',
    'support_cta_click',
    'support_request_sent',
]);

const analyticsBuckets = new Map();
const DEFAULT_ANALYTICS_LIMIT_MAX = 80;
const DEFAULT_ANALYTICS_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const getRequestIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || '';
};

const hashForAudit = (value) => {
    if (!value) return '';
    const salt = process.env.ANALYTICS_LOG_SALT || process.env.AI_LOG_SALT || process.env.JWT_SECRET || 'abqora-analytics';
    return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32);
};

const getEnvNumber = (key, fallback) => {
    const value = Number(process.env[key]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
};

const pruneBuckets = (now, windowMs) => {
    for (const [key, bucket] of analyticsBuckets.entries()) {
        if (now - bucket.startedAt > windowMs * 4) analyticsBuckets.delete(key);
    }
};

const enforceAnalyticsRateLimit = (key) => {
    const now = Date.now();
    const windowMs = getEnvNumber('PUBLIC_ANALYTICS_RATE_LIMIT_WINDOW_MS', DEFAULT_ANALYTICS_LIMIT_WINDOW_MS);
    const maxRequests = getEnvNumber('PUBLIC_ANALYTICS_RATE_LIMIT_MAX', DEFAULT_ANALYTICS_LIMIT_MAX);
    pruneBuckets(now, windowMs);

    const bucket = analyticsBuckets.get(key);
    const nextBucket = bucket && now - bucket.startedAt <= windowMs
        ? bucket
        : { startedAt: now, count: 0 };
    nextBucket.count += 1;
    analyticsBuckets.set(key, nextBucket);

    return nextBucket.count <= maxRequests;
};

const serializeTopTargets = (rows) => rows.map((row) => ({
    target: row._id || 'غير محدد',
    count: row.count,
}));

const trackPublicEvent = async (req, res) => {
    try {
        const eventName = cleanText(req.body.eventName, 60);
        if (!allowedEvents.has(eventName)) {
            return res.status(400).json({ message: 'حدث التحليلات غير صالح' });
        }

        const rawSessionId = cleanText(req.headers['x-abqora-session-id'], 80);
        const ipHash = hashForAudit(getRequestIp(req));
        const sessionId = rawSessionId ? hashForAudit(rawSessionId) : '';
        const rateKey = sessionId || ipHash || 'anonymous';
        if (!enforceAnalyticsRateLimit(rateKey)) {
            return res.status(202).json({ status: 'ignored' });
        }

        const metadata = req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};

        await PublicAnalyticsEvent.create({
            sourcePage: cleanText(req.body.sourcePage, 80) || 'public',
            eventName,
            target: cleanText(req.body.target, 100),
            sessionId,
            ipHash,
            userAgent: cleanText(req.headers['user-agent'], 220),
            metadata: {
                percentageBand: cleanText(metadata.percentageBand, 40),
                track: cleanText(metadata.track, 80),
                degreeSystem: cleanText(metadata.degreeSystem, 80),
            },
        });

        return res.status(202).json({ status: 'tracked' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAdminAnalyticsSummary = async (req, res) => {
    try {
        const sourcePage = cleanText(req.query.sourcePage, 80) || 'thanaweya-result';
        const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 30);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const eventMatch = { sourcePage, createdAt: { $gte: since } };

        const [
            totalEvents,
            pageViews,
            uniqueVisitorRows,
            aiQuestions,
            supportRequests,
            supportOpen,
            topServiceClicks,
            officialClicks,
            calculatorUses,
            supportClicks,
        ] = await Promise.all([
            PublicAnalyticsEvent.countDocuments(eventMatch),
            PublicAnalyticsEvent.countDocuments({ ...eventMatch, eventName: 'page_view' }),
            PublicAnalyticsEvent.aggregate([
                { $match: { ...eventMatch, eventName: 'page_view' } },
                { $group: { _id: { $cond: [{ $ne: ['$sessionId', ''] }, '$sessionId', '$ipHash'] } } },
                { $count: 'count' },
            ]),
            AiPublicConversation.countDocuments({ sourcePage, createdAt: { $gte: since } }),
            SupportRequest.countDocuments({ sourcePage, createdAt: { $gte: since } }),
            SupportRequest.countDocuments({ sourcePage, status: { $in: ['new', 'in_progress'] } }),
            PublicAnalyticsEvent.aggregate([
                { $match: { ...eventMatch, eventName: 'service_click' } },
                { $group: { _id: '$target', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 6 },
            ]),
            PublicAnalyticsEvent.countDocuments({ ...eventMatch, eventName: 'official_link_click' }),
            PublicAnalyticsEvent.countDocuments({ ...eventMatch, eventName: 'calculator_used' }),
            PublicAnalyticsEvent.countDocuments({ ...eventMatch, eventName: 'support_cta_click' }),
        ]);

        return res.json({
            sourcePage,
            days,
            since,
            totals: {
                totalEvents,
                pageViews,
                uniqueVisitors: uniqueVisitorRows[0]?.count || 0,
                aiQuestions,
                supportRequests,
                supportOpen,
                officialClicks,
                calculatorUses,
                supportClicks,
            },
            topServiceClicks: serializeTopTargets(topServiceClicks),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { trackPublicEvent, getAdminAnalyticsSummary };
