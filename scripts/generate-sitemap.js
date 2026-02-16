const axios = require('axios');
const xmlbuilder = require('xmlbuilder');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://fruhub.store';
const API_URL = 'https://api.fashioncarft.com/public/api';
const STORE_ID = 24;

const STATIC_PAGES = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/aboutus', priority: 0.8, changefreq: 'monthly' },
    { url: '/contact-us', priority: 0.7, changefreq: 'monthly' },
    { url: '/collections', priority: 0.9, changefreq: 'weekly' },
    { url: '/privacy-policy', priority: 0.5, changefreq: 'monthly' },
    { url: '/term-condition', priority: 0.5, changefreq: 'monthly' },
    { url: '/return-exchange', priority: 0.5, changefreq: 'monthly' },
    { url: '/Refund-and-Cancellation-Policy', priority: 0.5, changefreq: 'monthly' },
    { url: '/shipping-delivery', priority: 0.5, changefreq: 'monthly' },
    { url: '/order/tracking', priority: 0.6, changefreq: 'monthly' },
    { url: '/offers', priority: 0.8, changefreq: 'weekly' },
    { url: '/search', priority: 0.5, changefreq: 'monthly' },
    { url: '/seller/become-seller', priority: 0.7, changefreq: 'monthly' },
    { url: '/seller/stores', priority: 0.8, changefreq: 'weekly' },
    { url: '/account/dashboard', priority: 0.4, changefreq: 'monthly' },
];

async function fetchData(endpoint, params = {}) {
    try {
        const response = await axios.get(`${API_URL}/${endpoint}`, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

async function getAllItems(endpoint, slugKey = 'slug') {
    let items = [];
    let page = 1;
    let lastPage = 1;

    // Initial fetch to get total pages
    const initialData = await fetchData(endpoint, { store_id: STORE_ID, page: 1, paginate: 50 });
    if (initialData && initialData.data) {
        items = items.concat(initialData.data);
        lastPage = initialData.last_page;
    }

    // Fetch remaining pages
    for (page = 2; page <= lastPage; page++) {
        const data = await fetchData(endpoint, { store_id: STORE_ID, page: page, paginate: 50 });
        if (data && data.data) {
            items = items.concat(data.data);
        }
    }
    return items;
}

function generateSitemap() {
    const root = xmlbuilder.create('urlset', { version: '1.0', encoding: 'UTF-8' })
        .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd');

    const addUrl = (loc, priority, changefreq) => {
        const url = root.ele('url');
        url.ele('loc', loc);
        url.ele('lastmod', new Date().toISOString());
        url.ele('changefreq', changefreq);
        url.ele('priority', priority);
    };

    const process = async () => {
        // 1. Static Pages
        console.log('Processing static pages...');
        STATIC_PAGES.forEach(page => {
            addUrl(`${BASE_URL}${page.url}`, page.priority, page.changefreq);
        });

        // 2. Categories
        console.log('Fetching categories...');
        const categories = await getAllItems('category');
        categories.forEach(category => {
            if (category.slug) {
                addUrl(`${BASE_URL}/category/${category.slug}`, 0.8, 'weekly');
            }
        });

        // 3. Products
        console.log('Fetching products...');
        const products = await getAllItems('product');
        products.forEach(product => {
            if (product.slug) {
                addUrl(`${BASE_URL}/product/${product.slug}`, 0.7, 'daily');
            }
        });

        // 4. Stores
        console.log('Fetching stores...');
        const stores = await getAllItems('store');
        stores.forEach(store => {
            if (store.slug) {
                addUrl(`${BASE_URL}/seller/store/${store.slug}`, 0.8, 'weekly');
            }
        });

        // Write to file
        const xml = root.end({ pretty: true });
        const outputPath = path.join(__dirname, '../src/sitemap.xml');
        fs.writeFileSync(outputPath, xml);
        console.log(`Sitemap generated successfully at ${outputPath}`);
    };

    process();
}

generateSitemap();
