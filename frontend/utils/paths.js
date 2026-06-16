export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/abqora-mvp';

const isExternalUrl = (path) => /^(https?:)?\/\//.test(path);

export const withBasePath = (path = '/') => {
    if (!path) {
        return BASE_PATH || '/';
    }

    if (isExternalUrl(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
        return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (!BASE_PATH) {
        return normalizedPath;
    }

    if (normalizedPath === BASE_PATH || normalizedPath.startsWith(`${BASE_PATH}/`)) {
        return normalizedPath;
    }

    return `${BASE_PATH}${normalizedPath}`;
};
