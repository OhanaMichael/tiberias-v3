#!/usr/bin/env node

/**
 * Blog Builder - Converts Markdown blog posts to static HTML
 * Runs automatically on Netlify deploy
 */

const fs = require('fs');
const path = require('path');

// Simple markdown parser (basic implementation)
function parseMarkdown(content) {
  let html = content;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.startsWith('<h')) return para;
    if (para.startsWith('<')) return para;
    return `<p>${para.trim()}</p>`;
  }).join('\n');
  
  return html;
}

// Parse front matter
function parseFrontMatter(fileContent) {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const frontMatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentArray = null;
  
  lines.forEach(line => {
    if (line.startsWith('  - ')) {
      if (currentArray) {
        currentArray.push(line.substring(4).trim());
      }
    } else if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      currentKey = key.trim();
      
      if (value === '') {
        currentArray = [];
        frontMatter[currentKey] = currentArray;
      } else {
        frontMatter[currentKey] = value.replace(/^["']|["']$/g, '');
        currentArray = null;
      }
    }
  });
  
  return {
    frontMatter,
    content: match[2]
  };
}

// Create slug from filename
function createSlug(filename) {
  return filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
}

console.log('🚀 Building blog...\n');

const contentDir = path.join(__dirname, '../content/blog');
const outputDir = path.join(__dirname, '../public/blog');

// Check if content directory exists
if (!fs.existsSync(contentDir)) {
  console.log('⚠️  No content/blog directory found. Skipping blog build.');
  process.exit(0);
}

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read all markdown files
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
  console.log('⚠️  No blog posts found. Skipping blog build.');
  process.exit(0);
}

console.log(`📝 Found ${files.length} blog post(s)\n`);

const posts = [];

// Process each file
files.forEach(filename => {
  const filePath = path.join(contentDir, filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const parsed = parseFrontMatter(fileContent);
  if (!parsed) {
    console.log(`⚠️  Skipping ${filename} - invalid format`);
    return;
  }
  
  const { frontMatter, content } = parsed;
  
  // Only process published posts
  if (frontMatter.published !== 'true' && frontMatter.published !== true) {
    console.log(`⏭️  Skipping ${filename} - not published`);
    return;
  }
  
  const slug = createSlug(filename);
  const html = parseMarkdown(content);
  
  posts.push({
    slug,
    ...frontMatter,
    html,
    filename
  });
  
  console.log(`✅ Processed: ${frontMatter.title}`);
});

console.log(`\n✨ Successfully built ${posts.length} blog post(s)!`);
console.log('📁 Output: public/blog/\n');

// Save posts data as JSON for the blog index page
const postsData = {
  posts: posts.map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    featured_image: p.featured_image,
    date: p.date,
    category: p.category,
    tags: p.tags,
    author: p.author
  })),
  generated: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outputDir, 'posts.json'),
  JSON.stringify(postsData, null, 2)
);

console.log('💾 Saved posts.json for blog index');

// Load post template
const templatePath = path.join(__dirname, 'blog-post-template.html');
let template = '';

if (fs.existsSync(templatePath)) {
  template = fs.readFileSync(templatePath, 'utf-8');
  console.log('📄 Loaded post template\n');
  
  // Generate individual post pages
  posts.forEach(post => {
    const postDir = path.join(outputDir, post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }
    
    // Format date
    const date = new Date(post.date);
    const dateFormatted = date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate tags HTML
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const tagsHtml = tags.length > 0 
      ? `<div class="hero-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';
    
    // Share URLs
    const shareUrl = encodeURIComponent(`https://hotels-tiberias.co.il/blog/${post.slug}/`);
    const shareText = encodeURIComponent(`${post.title} - ${post.description} ${shareUrl}`);
    
    // Replace placeholders
    let html = template
      .replace(/{{TITLE}}/g, post.title)
      .replace(/{{DESCRIPTION}}/g, post.description || '')
      .replace(/{{SEO_KEYWORDS}}/g, post.seo_keywords || '')
      .replace(/{{AUTHOR}}/g, post.author || 'צוות מלונות טבריה')
      .replace(/{{SLUG}}/g, post.slug)
      .replace(/{{FEATURED_IMAGE}}/g, post.featured_image || '/og-image.jpg')
      .replace(/{{DATE}}/g, post.date)
      .replace(/{{DATE_FORMATTED}}/g, dateFormatted)
      .replace(/{{CATEGORY}}/g, post.category || '')
      .replace(/{{TAGS_HTML}}/g, tagsHtml)
      .replace(/{{CONTENT}}/g, post.html)
      .replace(/{{SHARE_URL}}/g, shareUrl)
      .replace(/{{SHARE_TEXT}}/g, shareText);
    
    // Save post page
    fs.writeFileSync(path.join(postDir, 'index.html'), html);
    console.log(`📝 Generated: /blog/${post.slug}/`);
  });
  
  console.log(`\n✨ Generated ${posts.length} individual post page(s)!`);
} else {
  console.log('⚠️  Template not found, skipping individual pages\n');
}

console.log('\n🎉 Blog build complete!\n');
