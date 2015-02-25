"use strict";

var gulp = require('gulp'),
    connect = require('gulp-connect'),
    opn = require('opn'),
    clean = require('gulp-clean'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    less = require('gulp-less'),
    spritesmith  = require('gulp.spritesmith'),
    livereload = require('gulp-livereload'),
    jade = require('gulp-jade'),
    notify = require("gulp-notify"),
    imageop = require('gulp-image-optimization'),
    prettify = require('gulp-prettify'),
    LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    autoprefix= new LessPluginAutoPrefix({browsers: ["last 2 versions"]}),
    wiredep = require('wiredep').stream;

// Запускаем локальный сервер
gulp.task('connect', function() {
    connect.server({
        root: 'app',
        livereload: true
    });
    opn('http://localhost:8080/');
});

gulp.task('html', function () {
    gulp.src('./app/jade/_pages/*.jade')
        .pipe(jade({
            pretty: true
        }))
        .pipe(prettify({indent_size: 4}))
        .pipe(gulp.dest('./app/'))
        .pipe(connect.reload())
        .pipe(notify("Jade done!"));
});

// Компилим less в css и ставим префиксы
gulp.task('css', function () {
    gulp.src('./app/less/*.less')
        .pipe(less({
            plugins: [autoprefix]
        }))
        .pipe(gulp.dest('./app/css'))
        .pipe(connect.reload())
        .pipe(notify("CSS done!"));
});

// JS
gulp.task('js', function () {
    gulp.src('./app/js/*.js')
        .pipe(connect.reload());
});

// Подключаем ссылки на bower_components
gulp.task('wiredep', function () {
    gulp.src('app/jade/_layouts/*.jade')
        .pipe(wiredep({
            directory : 'app/bower_components',
            ignorePath: '../../'
        }))
        .pipe(gulp.dest('app/jade/_layouts/'))
        .pipe(notify("Wiredep done!"));
});

// Слежка!
gulp.task('watch', function () {
    gulp.watch('./app/jade/**/*.jade', ['html']);
    gulp.watch('./app/less/*.less', ['css']);
    gulp.watch(['./app/img/**/*.png','./app/img/**/*.jpg','./app/img/**/*.gif','./app/img/**/*.jpeg'], ['images']);
    gulp.watch('./app/img/icons/*.png', ['sprite']);
    gulp.watch('./app/js/*.js', ['js']);
    gulp.watch(['bower.json'], ['wiredep']);
});

//Спрайты
gulp.task('sprite', function() {
    var spriteData =
        gulp.src('./app/img/icons/*.png')
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: 'sprite.css',
                imgPath: '../img/sprite.png',
                algorithm: 'binary-tree',
                padding: 5
            }));
    spriteData.img.pipe(gulp.dest('./app/img'));
    spriteData.css.pipe(gulp.dest('./app/css'));
});

// BUILD DIST!!!
gulp.task('build', function () {
    var assets = useref.assets();
    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'))
        .pipe(notify("Build done!"));
});

//Оптимизмруем изображения и кладем их в dist версию
gulp.task('images', function(cb) {
    gulp.src(['./app/img/*.png','./app/img/*.jpg','./app/img/*.gif','./app/img/*.jpeg']).pipe(imageop({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })).pipe(gulp.dest('./app/img')).on('end', cb).on('error', cb);
});

//Перемещаем в dist шрифты,favicon и .htaccess
gulp.task('copy', function () {
    gulp.src('./app/fonts/**')
        .pipe(gulp.dest('dist/fonts'));
    gulp.src(['./app/favicon.ico','./app/.htaccess'])
        .pipe(gulp.dest('dist'));
    //gulp.src('./app/img/sprites/*.png')
    gulp.src(['./app/img/*.png','./app/img/*.jpg','./app/img/*.gif','./app/img/*.jpeg'])
        .pipe(gulp.dest('dist/img'));
});

// Очистка
gulp.task('clean', function () {
    return gulp.src('dist', {read: false}).pipe(clean());
});

// Default
gulp.task('default', ['connect', 'watch', 'css', 'html','images','sprite']);
