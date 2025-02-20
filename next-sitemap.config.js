/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://poolcompliancesa.com.au',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/checkout/*', '/login', '/api/*'],
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout/*', '/login', '/api/*'],
      },
    ],
  },
  transform: async (config, path) => {
    // Custom transform function for dynamic pages
    const defaultPriority = config.priority;
    const defaultChangefreq = config.changefreq;

    // Assign higher priority to main pages
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    if (path === '/book-compliance' || path === '/contact' || path === '/about-us') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // Default transformation for all other pages
    return {
      loc: path,
      changefreq: defaultChangefreq,
      priority: defaultPriority,
      lastmod: new Date().toISOString(),
    };
  },
};
