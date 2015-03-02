var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    livereload = require('gulp-livereload');

function loadEnvironment() {
    var localConfig;
    try {
        localConfig = require('./config/local.env');
        for (var k in localConfig) {
            if (localConfig.hasOwnProperty(k)) {
                process.env[k] = localConfig[k];
            }
        }
    } catch (e) {
        localConfig = {};
    }
}

gulp.task('develop', function() {
    loadEnvironment();
    livereload.listen();
    nodemon({
        script: 'server.js',
        ext: 'js jade',
    }).on('restart', function() {
        setTimeout(function() {
            livereload.changed(__dirname);
        }, 500);
    });
});

gulp.task('spider', function() {
    loadEnvironment();
    nodemon({script: 'spider.js', ignore: ['*.*']});
});

gulp.task('default', [
    'develop'
]);
