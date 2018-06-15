'use strict';

var optimizeImgs = false;

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
    assets: 'assets/',
    base: './project'
}

dir.style     = dir.assets + 'styles/';
dir.fonts     = dir.assets + 'fonts/';
dir.js        = dir.assets + 'js/';
dir.bootstrap = dir.assets + 'bootstrap/';

var path = {
    build: {
        html: dir.build,
        js: dir.build + dir.assets,
        css: dir.build,
        img: dir.build + 'img/',
        fonts: dir.build + dir.fonts
    },
    src: {
        html: dir.src + '*.html',
        js: dir.src + dir.js + 'main.js',
        style: dir.src + 'template_styles.scss',
        img: dir.src + 'img/**/*.*',
        fonts: dir.src + 'fonts/**/*.*',
        bootstrap: dir.src + dir.bootstrap + 'bootstrap.scss'
    },
    watch: {
        html: dir.src + '**/*.html',
        js: dir.src + dir.js + '**/*.js',
        style: dir.src + dir.style + '**/*.scss',
        img: dir.src + 'img/**/*.*',
        fonts: dir.src + 'fonts/**/*.*',
        bootstrap: dir.src + dir.bootstrap + '**/*.scss'
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

    gulp.src(dir.src + 'assets/bootstrap/bootstrap.scss')
        // .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin()) //Сожмем
        // .pipe(sourcemaps.write())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dir.build + 'assets/'));
});

gulp.task('bootstrap:build', function () {
    gulp.src(path.src.bootstrap)
        // .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin()) //Сожмем
        // .pipe(sourcemaps.write())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dir.build + dir.assets));
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

gulp.task('image:move', function() {
    gulp.src(path.src.img)
        .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts:move', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

/**
 * move vendor packages (use after bower)
 */
gulp.task('jquery:move', function () {
    // jquery
    gulp.src('bower_components/jquery/dist/jquery.min.js')
        .pipe(gulp.dest(path.build.js));
});

gulp.task('fancybox:move', function () {
    // jquery
    gulp.src('bower_components/fancybox/dist/*.*')
        .pipe(gulp.dest(path.build.js + 'plugins/fancybox/'));
});

gulp.task('slick:move', function () {
    // jquery
    gulp.src('bower_components/slick-carousel/slick/**/*.*')
        .pipe(gulp.dest(path.build.js + 'plugins/slick/'));
});

gulp.task('style:move', function () {
    // copy scss source for next re-compile
    gulp.src(path.src.style)
        .pipe(gulp.dest(dir.build));

    gulp.src(path.watch.style)
        .pipe(gulp.dest(dir.build + dir.style))
});

gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.bootstrap], function(event, cb) {
        gulp.start('bootstrap:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        if( optimizeImgs )
            gulp.start('image:build');
        else
            gulp.start('image:move');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:move');
    });
});

gulp.task('webserver', function () {
    browserSync(srvConfig);
});

gulp.task('clean', function (cb) {
    rimraf(dir.base, cb);
});

var buildArgs = [
    'html:build',
    'js:build',
    'style:build',
    'bootstrap:build',
    'fonts:move'
];

buildArgs.push( optimizeImgs ? 'image:build' : 'image:move' );

// build project
gulp.task('build', buildArgs);

// build vendor packages
gulp.task('move', [
    'jquery:move',
    'fancybox:move',
    'slick:move',
    'style:move'
]);

// init project (first build | rebuild bootstrap)
gulp.task('init', ['move', 'build']);

// start development
gulp.task('default', ['build', 'webserver', 'watch']);