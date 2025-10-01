/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || "https://gatherin.com.br",
  generateRobotsTxt: true, // generates robots.txt
  sitemapSize: 5000, // split if you have more than 5000 URLs
  changefreq: "weekly", // tells Google how often pages update
  priority: 0.7, // default priority for pages
  exclude: [], // exclude paths from sitemap
  robotsTxtOptions: {
    additionalSitemaps: [],
  },
};
