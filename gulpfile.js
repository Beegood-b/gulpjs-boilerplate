const { src, dest, watch, parallel, series } = require('gulp');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const webp = require('gulp-webp');
const newer = require('gulp-newer');
const ttf2woff2 = require('gulp-ttf2woff2');
const include = require('gulp-file-include');
const rigger = require('gulp-rigger');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const changed = require('gulp-changed');


function fonts() {
    return src('build/fonts/accomodate/**/*.*')
        .pipe(changed('build/fonts', { extension: '.woff2' }))
        .pipe(ttf2woff2())
        .pipe(dest('build/fonts'))
}

function images() {
    return src('build/img/accomodate/**/*.*')
        .pipe(newer('build/img'))
        .pipe(webp())
        .pipe(dest('build/img'))
}

function scripts() {
    return src('build/js/accomodate/**/*.js')
        .pipe(rigger())
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min",
            extname: ".js"
        }))
        .pipe(dest('build/js'))
        .pipe(browserSync.stream());
}

function pages() {
    return src('build/**/*.dev.html', {base: 'build/pages'})
        .pipe(include({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(rename(function (path) {
            path.basename = path.basename.replace(".dev", "");
            path.extname = ".html";
        }))
        .pipe(dest('build')) 
        .pipe(browserSync.stream());
}

function scss() {
    return src('build/scss/*')
    .pipe(browserSync.stream())
}

function watching() {
    browserSync.init({
        server: {
            baseDir: "build/"
        }
    });
    watch(['build/fonts/accomodate/**/*.*'], fonts)
    watch(['build/img/accomodate/**/*.*'], images)
    watch(['build/partials/**/*.html', 'build/**/*.dev.html'], pages)
    watch(['build/scss/**'], scss)
    watch(['build/js/accomodate/**/*.js', 'build/js/components/**/*.js'], scripts)
    .on('change', browserSync.reload)
}

function building() {
    return src([
        'build/img/**/*.*',
        '!build/img/accomodate/**/*.*',
        'build/fonts/**/*.*',
        '!build/fonts/accomodate/**/*.*',
        'build/*.html',
        '!build/pages/*.dev.html',
        '!build/pages/**/*.*',
        'build/css/*.css',
        'build/js/**/*.min.js',
    ], {base : 'build'})
        .pipe(dest('dist'))
}

exports.fonts = fonts;
exports.images = images;
exports.scripts = scripts;
exports.pages = pages;
exports.scss = scss;
exports.building = building;
exports.watching = watching;

exports.build = series(fonts, images, scripts, pages, scss, building);
exports.default = parallel(fonts, images, scripts, pages, scss, watching);