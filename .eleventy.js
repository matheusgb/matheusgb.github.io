const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItLinkAttributes = require('markdown-it-link-attributes')

module.exports = function(eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(syntaxHighlight)
  
  // To enable merging of tags
  eleventyConfig.setDataDeepMerge(true)

  // Corrige problema de fuso horário nas datas
  eleventyConfig.addFilter('dateDisplay', (dateObj) => {
    // Garante que a data seja tratada como local, não UTC
    const date = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000))
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  })

  // Copy these static files to _site folder
  eleventyConfig.addPassthroughCopy('src/assets')
  eleventyConfig.addPassthroughCopy('src/manifest.json')

  // To create excerpts
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_alias: 'post_excerpt',
    excerpt_separator: '<!-- excerpt -->'
  })

  // Enable us to iterate over all the tags, excluding posts and all
  eleventyConfig.addCollection('tagList', collection => {
    const tagsSet = new Set()
    collection.getAll().forEach(item => {
      if (!item.data.tags) return
      item.data.tags
        .filter(tag => !['posts', 'all'].includes(tag))
        .forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  })

  const md = markdownIt({ 
    html: true, 
    linkify: true,
    typographer: true,
    breaks: false,
    xhtmlOut: false
  })
  
  md.use(markdownItAnchor, { 
    level: [1, 2], 
    permalink: markdownItAnchor.permalink.headerLink({ 
      safariReaderFix: true,
      class: 'header-anchor',
    })
  })
  
  // Configura links externos para abrir em nova aba
  md.use(markdownItLinkAttributes, {
    matcher(href) {
      return href.match(/^https?:\/\//)
    },
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  })
  
  eleventyConfig.setLibrary('md', md)

  // asset_img shortcode
  eleventyConfig.addLiquidShortcode('asset_img', (filename, alt) => {
    return `<img class="my-4" src="/assets/img/posts/${filename}" alt="${alt}" />`
  })

  return {
    dir: {
      input: 'src'
    },
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'liquid',
    templateFormats: ['md', 'liquid', 'html']
  }
}
