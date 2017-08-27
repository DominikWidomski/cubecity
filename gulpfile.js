const gulp = require('gulp');
const child = require('child_process');
const gutil = require('gulp-util');
const path = require('path');
const plugins = require('gulp-load-plugins')({
        DEBUG: true,
        // pattern: ['gulp-*', 'gulp.*'],
        scope: ['dependencies', 'devDependencies', 'peerDependencies'],
        // replaceString: /^gulp(-|\.)/,
        // camelize: true,
        lazy: true
    });
const $ = plugins; // @TODO: consolidate this
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
// @TODO: Duplicate of gutil above
const util = require('gulp-util');

// const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const config = {
    // assetsDir: 'resources/assets',
    // sassPattern: 'sass/**/*.scss',
    production: !!util.env.production
};

const siteRoot = 'public/';

const paths = {
    styles: {
        src: './resources/scss/app.scss',
        watch: './resources/scss/**/*',
        dest: './public/assets/css/'
    },
    scripts: {
        main: './resources/js/app.js',
        watch: './resources/js/**/*.js',
        dest: './public/assets/js/',
        out: 'app.js'
    }
};

/**
 * Handle errors for a plugin by generating a gulp-notify notification and
 * logging to console based on current gulp-util environment setting.
 *
 * @param {string} taskName Name of task, used in notification title
 */
function handleError(taskName) {
    return notify.onError({
        title: 'gulp ' + taskName + ' Task ' + (!gutil.env.production ? 'Warning' : 'Failed'),
        emitError: gutil.env.production // Log errors as warnings without ending stream
    });
}


gulp.task('styles:css', function(){
    gulp.src(paths.styles.src)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass())
        .on('error', handleError('css'))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(plugins.sourcemaps.write())
        .pipe(notify('CSS COMPILED'))
        .pipe(gulp.dest(paths.styles.dest));
});

// gulp.task('serve', () => {
//   browserSync.init({
//     files: [siteRoot + '/**'],
//     port: 3001,
//     server: {
//       baseDir: siteRoot
//     }
//   });
// });

gulp.task('scripts', function () {
    return gulp.src(paths.scripts.main)
        .pipe(webpackStream({
            context: path.join(__dirname, path.dirname(paths.scripts.main)),
            output: {
                filename: paths.scripts.out
            },
            module: {
                loaders: [
                    {
                        loader: 'babel-loader',
                        test: /\.js$/,
                        exclude: /node_modules/
                    }
                ]
            },
            // presets: ["es2015"],
            // resolve: {
                // modulesDirectories: [path.join(__dirname, '/node_modules')]
            // },
            devtool: gutil.env.production ? '' : 'inline-source-map'
        }))
        .pipe(gutil.env.production ? plugins.uglify() : gutil.noop())
        .on('error', handleError('scripts'))
        .pipe(notify('JS COMPILED'))
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('clean:assets', () => {
    return gulp.src('./public/assets/', {read: false})
        .pipe($.clean());
});

gulp.task('clean:public', () => {
    return gulp.src('./public/', {read: false})
        .pipe($.clean());
});

gulp.task('clean', ['clean:public']);

/**
 * gulp css
 *
 * Compile project styles
 * @TODO: Add gulp-uncss
 */
gulp.task('styles', ['styles:css']);

/**
 * Build
 */
gulp.task('build', ['styles', 'scripts']);

/**
 * gulp watch
 *
 * Run build and watch for changes
 */
gulp.task('watch', ['build'], function(){
    for (const task in paths) {
        gulp.watch(paths[task].watch, [task]);
    }
});

/**
 * gulp (default task)
 *
 * Alias for gulp build.
 */
gulp.task('default', ['build']);