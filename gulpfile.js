const { src, dest, watch, parallel, series } = require('gulp');

// HTML
const include = require('gulp-file-include');
const rigger = require('gulp-rigger');
const htmlmin = require('gulp-htmlmin');
// SASS
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
// JavaScript
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
// Fonts
const ttf2woff2 = require('gulp-ttf2woff2');
// Images
const webp = require('gulp-webp');
const newer = require('gulp-newer');
// Browser Sync
const browserSync = require('browser-sync').create();
// Utility
const changed = require('gulp-changed');
const clean = require('gulp-clean')
const fs = require('fs')


// Deleting dist folder 
function cleanDist(done) {
    // check if the folder exists
    if (fs.existsSync('./dist')) {
        return src('./dist', { read: false })
        .pipe(clean({ force: true }))
    }
    // if doesn't use callback
    done();
}

// Taks for fonts
function fonts() {
    return src('./src/fonts/accomodate/**/*.*')
        .pipe(changed('./src/fonts', { extension: '.woff2' }))
        .pipe(ttf2woff2())
        .pipe(dest('./src/fonts'))
}

// Task for images
function images() {
    return src('./src/img/accomodate/**/*.*')
        .pipe(newer('./src/img'))
        .pipe(webp())
        .pipe(dest('./src/img'))
}

// Task for JS files
function scripts() {
    return src('./src/js/accomodate/**/*.js')
        .pipe(rigger())
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min",
            extname: ".js"
        }))
        .pipe(dest('./src/js'))
        .pipe(browserSync.stream());
}

// Task for HTML files
function pages() {
    return src('./src/**/*.dev.html', {base: './src/pages'})
        .pipe(include({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(rename(function (path) {
            path.basename = path.basename.replace(".dev", "");
            path.extname = ".html";
        }))
        .pipe(dest('src')) 
        .pipe(browserSync.stream());
}

// Task for SASS
function styles() {
    return src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest("./src/css"))
        .pipe(browserSync.stream())
}

// Watch for changes
function watching() {
    browserSync.init({
        server: {
            baseDir: "./src/"
        }
    });
    watch(['./src/fonts/accomodate/**/*.*'], fonts)
    watch(['./src/img/accomodate/**/*.*'], images)
    watch(['./src/partials/**/*.html', './src/**/*.dev.html'], pages)
    watch(['./src/scss/**/*.scss'], styles)
    watch(['./src/js/accomodate/**/*.js', './src/js/components/**/*.js'], scripts)
        .on('change', browserSync.reload)
}

// Build project
function building() {
    return src([
        './src/img/**/*.*',
        '!./src/img/accomodate/**/*.*',
        './src/fonts/**/*.*',
        '!./src/fonts/accomodate/**/*.*',
        './src/*.html',
        '!./src/pages/*.dev.html',
        '!./src/pages/**/*.*',
        './src/css/*.css',
        './src/js/**/*.min.js',
    ], {base : './src'})
        .pipe(dest('./dist'))
}

exports.fonts = fonts;
exports.images = images;
exports.scripts = scripts;
exports.pages = pages;
exports.styles = styles;
exports.building = building;
exports.watching = watching;
exports.cleanDist = cleanDist;

exports.build = series(cleanDist, fonts, images, scripts, pages, styles, building);
exports.default = parallel(fonts, images, scripts, pages, styles, watching);