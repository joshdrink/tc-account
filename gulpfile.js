// =============================================================================

  // Clone
  // Authored by Josh Beveridge

  // "gulp"
  // "gulp build"

// =============================================================================

"use strict";

// URL Subdirectory ============================================================
// This variable is designed to allow for proper relative links when publishing to a subdirectory or Github Pages. If you plan on publishing to Github Pages, set this variable to the name of your repository.
let urlPrefix = "tc-account";

// Requirements ================================================================
const gulp = require('gulp');
const { series, parallel, src, dest, watch } = require('gulp');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const browsersync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const twig = require('gulp-twig');

// Tasks =======================================================================

    // Browser Sync
    let urlPath = "";
    if (urlPrefix == "") {
        urlPath = "cache/";
    } else {
        urlPath = "cache/" + urlPrefix + "/";
    }
    function browserSync(done) {
        if (urlPrefix == "") {
            browsersync.init({
                server: {
                    baseDir: "cache"
                },
            });
            done();
        } else {
            browsersync.init({
                server: {
                    baseDir: "cache/" + urlPrefix
                }
            });
            done();
        }
    };

    // BrowserSync Reload
    function browserSyncReload(done) {
        return src(urlPath + '*.html')
        .pipe(browsersync.reload({
            stream: true
        }));
    }

    // Twig
    let rootPath = "/" + urlPrefix;
    function template() {
        return src('app/twig/*.twig')
        .pipe(twig())
        .pipe(dest(urlPath));
    }
    function replacePath() {
        if (urlPrefix == "") {
            // Do Nothing
        } else {
            return src(urlPath + '*.html')
            .pipe(replace('$URL', ""))
            .pipe(dest(urlPath));
        }
    }
    function replaceDocsPath() {
        if (urlPrefix == "") {
            return src(urlPath + '*.html')
            .pipe(dest(urlPath));
        } else {
            return src(urlPath + '*.html')
            .pipe(replace('$URL', rootPath))
            .pipe(dest(urlPath));
        }
    }

    // Clone JS
    function moveCloneJS() {
        return src('node_modules/clone-framework/dist/js/clone.min.js')
        .pipe(dest(urlPath + 'js/clone'));
    }

    // JavaScript
    function js() {
        return src('app/js/*.js')
        .pipe(concat('app.js'))
        .pipe(dest(urlPath + 'js'));
    }

    // Sass
    function compileCSS() {
        return src('app/scss/**/*.scss')
        .pipe(sass())
        .pipe(postcss([autoprefixer()]))
        .pipe(dest(urlPath + 'css'));
    }

    // Images
    function cacheImages() {
        return src('app/img/**/*')
        .pipe(dest(urlPath + 'img'));
    }

    function moveImages() {
        return src(urlPath + 'img/**/*')
        .pipe(dest('docs/img'));
    }

    // Minification
    function docsCacheHTML() {
        return src(urlPath + '**/*.html')
        .pipe(dest('docs'));
    }
    function docsCacheJS() {
        return src(urlPath + 'js/*.js')
        .pipe(uglify())
        .pipe(dest('docs/js'));
    }
    function docsCacheCSS() {
        return src(urlPath + 'css/*.css')
        .pipe(postcss([cssnano()]))
        .pipe(dest('docs/css'));
    }
    function docsCloneJS() {
        return src(urlPath + 'js/clone/*.js')
        .pipe(dest('docs/js/clone'));
    }
    function docsFavicons() {
        return src('app/favicons/*')
        .pipe(dest('docs'));
    }

    // Cache Removal
    function cleanCache() {
        return del('cache/**/*')
    }

    // Docs Removal
    function cleanDocs() {
        return del(['docs/**/*', '!docs/CNAME']);
    }

    // Compile
    const compile = series(cleanCache, template, replacePath, moveCloneJS, js, cacheImages, compileCSS);

    // docs
    const docsCompile = series(cleanCache, template, replaceDocsPath, moveCloneJS, js, cacheImages, compileCSS);
    const docs = series(docsCacheHTML, docsCacheJS, docsCacheCSS, docsCloneJS, moveImages, docsFavicons);

    // Watch
    function watchFiles() {
        watch('app/scss/**/*.scss', series(compile, browserSyncReload));
        watch('app/twig/**/*.twig', series(compile, browserSyncReload));
        watch('app/js/*.js', series(compile, browserSyncReload));
    }

    // Export
    exports.build = series(cleanDocs, docsCompile, docs);
    exports.watch = series(compile, parallel(browserSync, watchFiles));
    exports.default = series(compile, parallel(browserSync, watchFiles));