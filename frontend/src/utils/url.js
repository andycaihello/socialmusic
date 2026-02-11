/**
 * 获取完整的资源 URL
 * @param {string} path - 资源路径（如 /uploads/avatar.jpg）
 * @returns {string} 完整的 URL
 */
export const getFullUrl = (path) => {
  if (!path) return null;

  // 如果已经是完整的 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 获取 API URL 并移除 /api 后缀
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const baseUrl = apiUrl.replace('/api', '');

  // 拼接完整 URL
  return `${baseUrl}${path}`;
};

/**
 * 获取头像 URL
 * @param {string} avatarUrl - 头像路径
 * @returns {string} 完整的头像 URL
 */
export const getAvatarUrl = (avatarUrl) => {
  return getFullUrl(avatarUrl);
};

/**
 * 获取封面图 URL
 * @param {string} coverUrl - 封面图路径
 * @returns {string} 完整的封面图 URL
 */
export const getCoverUrl = (coverUrl) => {
  return getFullUrl(coverUrl);
};
