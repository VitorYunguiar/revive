const { app } = require('../index');

const buildApiUrl = (pathParam, query = {}) => {
    const pathParts = Array.isArray(pathParam)
        ? pathParam
        : String(pathParam || '').split('/').filter(Boolean);

    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (key === 'path') return;
        if (Array.isArray(value)) {
            value.forEach((item) => searchParams.append(key, item));
            return;
        }
        if (value !== undefined) searchParams.append(key, value);
    });

    const search = searchParams.toString();
    const apiPath = `/api/${pathParts.join('/')}`.replace(/\/$/, '') || '/api';
    return search ? `${apiPath}?${search}` : apiPath;
};

const getRequestQuery = (req) => {
    if (req.query) return req.query;

    const url = new URL(req.url, 'http://localhost');
    const query = {};

    url.searchParams.forEach((value, key) => {
        const currentValue = query[key];
        if (Array.isArray(currentValue)) {
            currentValue.push(value);
            return;
        }
        if (currentValue !== undefined) {
            query[key] = [currentValue, value];
            return;
        }
        query[key] = value;
    });

    return query;
};

module.exports = (req, res) => {
    const query = getRequestQuery(req);

    if (query.path) {
        req.url = buildApiUrl(query.path, query);
    }

    return app(req, res);
};
