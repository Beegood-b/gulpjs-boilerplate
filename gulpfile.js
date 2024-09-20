// eslint-disable-next-line object-curly-newline
const { src, dest, watch, parallel, series } = require('gulp');

// HTML
const include = require('gulp-file-include');
const rigger = require('gulp-rigger');
const htmlmin = require('gulp-htmlmin');
// SASS
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const sassGlob = require('gulp-sass-glob');
// JavaScript
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
const clean = require('gulp-clean');
const fs = require('fs');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

// const srcPath = 'src';
// const distPath = 'dist';

// const paths = {
//   src: {
//     root: srcPath,
//     html: srcPath,
//     fonts: `${srcPath}/assets/fonts/accomodate/**/*.woff2`,
//     images: `${srcPath}/assets/images/accomodate/**/*`,
//     js: `${srcPath}/js/accomodate/**/*.js`,
//     scss: `${srcPath}/scss/**/*.scss`,
//     pages: `${srcPath}/pages/**/*.html`,
//   },

//   dist: {
//     root: distPath,
//     html: distPath,
//     css: `${distPath}/css`,
//     js: `${distPath}/js`,
//     fonts: `${distPath}/fonts`,
//     images: `${distPath}/images`,
//   },

//   watch: {
//     root: srcPath,
//     html: srcPath,
//     fonts: `${srcPath}/assets/fonts/accomodate/**/*.woff2`,
//     images: `${srcPath}/assets/images/accomodate/**/*`,
//     js: `${srcPath}/js/accomodate/**/*.js`,
//     scss: `${srcPath}/scss/**/*.scss`,
//     pages: `${srcPath}/pages/**/*.html`,
//   },

//   clean: `./${distPath}`,
// };

// Deleting dist folder
// eslint-disable-next-line consistent-return
function del(done) {
  // Check if the folder already exists
  if (fs.existsSync('./dist' && './src/css')) {
    return src('./dist' && './src/css', { read: false }).pipe(
      clean({ force: true })
    );
  }
  // If it doesn't use the callback
  done();
}

// Plumber notify function
function plumberNotify() {
  notify.onError({
    title: 'title',
    message: 'Error <%= error.message %>',
    sound: false
  });
}

// Taks for fonts converting
function fonts() {
  return src('./src/assets/fonts/accomodate/**/*.*')
    .pipe(changed('./src/assets/fonts/accomodate', { extension: '.woff2' }))
    .pipe(ttf2woff2())
    .pipe(dest('./src/assets/fonts'));
}

// Task for images converting
function images() {
  return src('./src/assets/img/accomodate/**/*.*')
    .pipe(newer('./src/assets/img'))
    .pipe(webp())
    .pipe(dest('./src/assets/img'));
}

// Task for JS files
function scripts() {
  return src('./src/js/accomodate/**/*.js')
    .pipe(plumber(plumberNotify('JS')))
    .pipe(rigger())
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
        extname: '.js'
      })
    )
    .pipe(dest('./src/js'))
    .pipe(browserSync.stream());
}

// Task for HTML files
function pages() {
  return src('./src/**/*.dev.html', { base: './src/pages' })
    .pipe(plumber(plumberNotify('HTML')))
    .pipe(
      include({
        prefix: '@@',
        basepath: '@file'
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(
      rename((path) => {
        // eslint-disable-next-line no-param-reassign
        path.basename = path.basename.replace('.dev', '');
        // eslint-disable-next-line no-param-reassign
        path.extname = '.html';
      })
    )
    .pipe(dest('./src'))
    .pipe(browserSync.stream());
}

// Task for SASS
function styles() {
  return src('./src/scss/**/*.scss')
    .pipe(plumber(plumberNotify('SCSS')))
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(autoprefixer({ overrideBrowserslist: ['last 5 version'] }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./src/css'))
    .pipe(browserSync.stream());
}

// Watch for the changes
function watching() {
  browserSync.init({
    server: {
      baseDir: './src'
    }
  });

  watch(['./src/assets/fonts/accomodate/**/*.*'], fonts);
  watch(['./src/assets/img/accomodate/**/*.*'], images);
  watch(['./src/pages/**/*.html', './src/pages/**/*.dev.html'], pages);
  watch(['./src/scss/**/*.scss'], styles);
  watch(
    ['./src/js/accomodate/**/*.js', './src/js/components/**/*.js'],
    scripts
  ).on('change', browserSync.reload);
}

// Build the project - create dist folder
function building() {
  return src(
    [
      './src/assets/img/**/*.*',
      '!./src/assets/img/accomodate/**/*.*',
      './src/assets/fonts/**/*.*',
      '!./src/assets/fonts/accomodate/**/*.*',
      './src/*.html',
      '!./src/pages/*.dev.html',
      '!./src/pages/**/*.*',
      './src/css/*.css',
      './src/js/**/*.min.js'
    ],
    { base: './src' }
  ).pipe(dest('./dist'));
}

exports.fonts = fonts;
exports.images = images;
exports.scripts = scripts;
exports.pages = pages;
exports.styles = styles;
exports.building = building;
exports.watching = watching;
exports.del = del;

exports.build = series(del, fonts, images, scripts, pages, styles, building);
exports.default = parallel(fonts, images, scripts, pages, styles, watching);
