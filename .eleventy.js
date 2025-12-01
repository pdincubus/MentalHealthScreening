import htmlminifier from 'html-minifier';
import util from 'util';

export default async function(eleventyConfig) {
    eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

    //https://github.com/11ty/eleventy/issues/266#issuecomment-841304247
    eleventyConfig.addFilter('console', function(value) {
        const str = util.inspect(value);

        return `<div style="white-space: pre-wrap;">${unescape(str)}</div>`;
    });

    eleventyConfig.addPassthroughCopy({ 'public/fonts': 'fonts' });
    eleventyConfig.addPassthroughCopy({ 'public/img': 'img' });
    eleventyConfig.addPassthroughCopy({ 'public/js': 'js' });
    eleventyConfig.addPassthroughCopy({ 'public/css': 'css' });

    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'site/includes',
            layouts: 'site/layouts',
            data: 'site/data'
        },
        passthroughFileCopy: true,
        htmlTemplateEngine: 'njk',
        templateFormats: ['njk']
    };
}