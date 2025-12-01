import gulp from 'gulp';

import colours from 'ansi-colors';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import size from 'gulp-size';
import calc from 'postcss-calc';
import lightningCss from 'postcss-lightningcss';
import nested from 'postcss-nested';
import partialImports from 'postcss-import';
import presetEnv from 'postcss-preset-env';
import sortMediaQueries from 'postcss-sort-media-queries';
import systemUiFont from 'postcss-font-family-system-ui';
import reporter from 'postcss-reporter';
import ts from 'gulp-typescript';

const tsProject = ts.createProject('tsconfig.json');

const cssEntries = [
    {
        inputFile: 'src/site/css/index.css',
        outputFile: 'site.css'
    }
];

const cssOutputDest = 'dist/css';
const tsOutputDest = 'dist/js';
const cssWatchGlob = 'src/site/css/**/*.css';
const tsWatchGlob = 'src/site/ts/**/*.ts';

function postcssErrorHandler(label) {
    return function postcssError(err) {
        console.error(`${colours.redBright('[PostCSS error]')} ${colours.redBright('Error in' + label)}`);

        if (err.name === 'CssSyntaxError') {
            console.error(`${colours.redBright('[PostCSS error]')} ${colours.redBright(err.message)}`);

            if (typeof err.showSourceCode === 'function') {
                console.error(`${colours.redBright('[PostCSS error]')} ${colours.redBright(err.showSourceCode())}`);
            }
        } else {
            console.error(`${colours.redBright('[PostCSS error]')} ${colours.redBright(err.toString())}`);
        }

        this.emit('end');
    };
}

function tsError(err) {
    console.error(`${colours.redBright('[TypeScript error]')} ${colours.redBright(err.toString())}`);

    this.emit('end');
}

function makeCssTask(entry) {
    const pipeTitle =
        `${colours.yellow('[PostCSS]')}`;

    const cssTask = function cssTask() {
        return gulp
            .src(entry.inputFile, { sourcemaps: true })
            .pipe(plumber({ errorHandler: postcssErrorHandler }))
            .pipe(
                postcss([
                    partialImports(),
                    calc(),
                    presetEnv({
                        features: {
                            'cascade-layers': false
                        }
                    }),
                    nested(),
                    systemUiFont(),
                    sortMediaQueries({
                        sort: 'mobile-first'
                    }),
                    lightningCss(),
                    reporter({
                        clearReportedMessages: true,
                        clearAllMessages: true,
                        throwError: false,
                        positionless: 'last'
                    })
                ])
            )
            .pipe(rename(entry.outputFile))
            .pipe(
                size({
                    title: pipeTitle,
                    showFiles: true,
                    showTotal: false
                })
            )
            .pipe(gulp.dest(cssOutputDest, { sourcemaps: '.' }));
    };

    cssTask.displayName = `css:${entry.outputFile}`;

    return cssTask;
}

const cssTasks = cssEntries.map(makeCssTask);

export const compilePostCss = gulp.parallel(...cssTasks);

export function compileTypescript() {
    const pipeTitle =
        `${colours.yellow('[TypeScript]')}`;

    const tsResult = tsProject
        .src()
        .pipe(plumber({ errorHandler: tsError }))
        .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest(tsOutputDest)).pipe(
            size({
                title: pipeTitle,
                showFiles: true,
                showTotal: false
            })
        );
}

export function watchCss() {
    return gulp
        .watch(cssWatchGlob, compilePostCss)
        .on('change', path => {
            console.log(`${colours.yellow('[PostCSS]')} ${colours.white('Watcher fired for: ' + path)}`);
        });
}

export function watchTs() {
    return gulp
        .watch(tsWatchGlob, compileTypescript)
        .on('change', path => {
            console.log(`${colours.yellow('[TypeScript]')} ${colours.white('Watcher fired for: ' + path)}`);
        });
}

gulp.task(
    'default',
    gulp.series(compilePostCss, compileTypescript)
);

gulp.task(
    'dev',
    gulp.series(
        compilePostCss,
        compileTypescript,
        gulp.parallel(watchCss, watchTs)
    )
);