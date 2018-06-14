'use strict';

var gulp = require('gulp'),
    // html
    rigger = require('gulp-rigger'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    // style
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    cssmin = require('gulp-minify-css'),
    // image
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    // watch changes
    watch = require('gulp-watch'),
    rename = require('gulp-rename'),
    // server
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    // clear images
    rimraf = require('rimraf');

var dir = {
    build: 'project/',
    src: 'source/',
    base: './project',
    style: 'assets/styles/'
}

var path = {
    build: {
        html: dir.build,
        js: dir.build + 'assets/',
        css: dir.build,
        img: dir.build + 'img/',
        fonts: dir.build + 'assets/fonts/'
    },
    src: {
        html: dir.src + '*.html',
        js: dir.src + 'assets/js/main.js',
        style: dir.src + 'template_styles.scss',
        img: dir.src + 'img/**/*.*',
        fonts: dir.src + 'fonts/**/*.*'
    },
    watch: {
        html: dir.src + '**/*.html',
        js: dir.src + 'assets/js/**/*.js',
        style: dir.src + dir.style + '**/*.scss',
        img: dir.src + 'img/**/*.*',
        fonts: dir.src + 'fonts/**/*.*'
    },
};

var srvConfig = {
    server: {
        baseDir: dir.base
    },
    tunnel: false,
    host: 'localhost',
    port: 8080,
    logPrefix: "new.project"
};

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});

gulp.task('style:build', function () {
    gulp.src(path.src.style)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(prefixer())
        .pipe(cssmin())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));

    // copy scss source for next re-compile
    gulp.src(path.src.style)
        .pipe(gulp.dest(dir.build));

    gulp.src(path.watch.style)
        .pipe(gulp.dest(dir.build + dir.style))
});

gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

// move only
gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

/**
 * build vendor packages (use after bower)
 */
// move only
gulp.task('jquery:vbuild', function () {
    // jquery
    gulp.src('bower_components/jquery/dist/jquery.min.js')
        .pipe(gulp.dest(path.build.js));
});

gulp.task('bootstrap:vbuild', function () {
    gulp.src(dir.src + 'assets/bootstrap/bootstrap.scss')
        // .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin()) //Сожмем
        // .pipe(sourcemaps.write())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dir.build + 'assets/'))
});

// move only
gulp.task('fancybox:vbuild', function () {
    // jquery
    gulp.src('bower_components/fancybox/dist/*.*')
        .pipe(gulp.dest(path.build.js + 'plugins/fancybox/'));
});

// move only
gulp.task('slick:vbuild', function () {
    // jquery
    gulp.src('bower_components/slick-carousel/slick/**/*.*')
        .pipe(gulp.dest(path.build.js + 'plugins/slick/'));
});

gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
});

gulp.task('webserver', function () {
    browserSync(srvConfig);
});

gulp.task('clean', function (cb) {
    rimraf(dir.base, cb);
});

// build project
gulp.task('build', [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build'
]);

// build vendor packages
gulp.task('vbuild', [
    'jquery:vbuild',
    'bootstrap:vbuild',
    'fancybox:vbuild',
    'slick:vbuild',
]);

// init project (first build | rebuild bootstrap)
gulp.task('init', ['vbuild', 'build']);

// start development
gulp.task('default', ['build', 'webserver', 'watch']);