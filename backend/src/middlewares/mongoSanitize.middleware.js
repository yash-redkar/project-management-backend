
const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;

    for (const key of Object.keys(obj)) {
        // block mongo operators and dot notation in keys
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
            continue;
        }

        const val = obj[key];
        if (val && typeof val === "object") sanitize(val);
    }
};

export const mongoSanitizeMiddleware = (req, _res, next) => {
    sanitize(req.body);
    sanitize(req.params);
    sanitize(req.query); // mutate in-place, DON'T reassign req.query
    next();
};
