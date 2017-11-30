var
    async = require('async'),
    bump_ = require('gulp-bump'),
    del = require('del'),
    git_ = require('gulp-git'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    jeditor = require('gulp-json-editor'),
    jsonToYaml_ = require('gulp-json-to-yaml'),
    jsonfile = require('jsonfile'),
    path = require('path'),
    rename = require('gulp-rename'),
    tag = require('gulp-tag-version'),
    wait = require('gulp-wait');
yamlToJson_ = require('gulp-yaml');

var options = {
    'droneJsonFilename': '.drone.json',
    'droneYmlFilename': '.drone.yml',
    'packageFilename': 'package.json',
    'src': upPath(''),
    'type': 'patch',
    'use-v-prefix': true,
    'push-tag': true,
    'wait-before-push': 1000
},
    version = '',
    configured = false;

module.exports = {
    use: use,
    config: config,
    task: task
};

function use(gulp_) {
    //both should be referencing to the same gulp object though
    gulp = gulp_ || gulp;
}

function config(options_) {
    if (Object.keys(options_).length !== 0)
        options = Object.assign(options, options_);

    handleOptions(options);

    configured = true;
}

function handleOptions(options) {
    options.packagePath = upPath(options.packageFilename);
    options.droneYmlPath = upPath(options.droneYmlFilename);
    options.droneJsonPath = upPath(options.droneJsonFilename);
}

function upPath(str) {
    return path.join(__dirname, '..', '..', str);
}

function task(cb) {
    if (!configured)
        config({});

    return async.waterfall([
        bump,
        saveVersion,
        incrementDrone,
        incrementGit,
        git
    ],
        cb);
}

function bump(cb) {
    return gulp
        .src(options.packagePath)
        .pipe(bump_({ type: options.type }))
        .pipe(gulp.dest(options.src))
        .on('err', cb)
        .on('end', cb)
}

function saveVersion(cb) {
    return jsonfile.readFile(options.packagePath, function (err, obj) {
        if (err)
            cb(err);

        version = obj.version;
        cb(null);
    });
}

function incrementGit(cb) {
    return gulp
        .src([options.packagePath])
        .pipe(gulpif(options['use-v-prefix'], tag(), tag({
            prefix: ''
        })))
        .pipe(wait(options['wait-before-push']))
        .on('err', cb)
        .on('end', cb);
}

function incrementDrone(cb) {
    return async.waterfall([
        yamlToJson,
        editJson,
        jsonToYaml,
        deleteJson
    ], cb);
}

function yamlToJson(cb) {
    return gulp
        .src(options.droneYmlPath)
        .pipe(yamlToJson_({ safe: true }))
        .pipe(gulp.dest(options.src))
        .on('err', cb)
        .on('end', cb);
}

function editJson(cb) {
    return gulp
        .src(options.droneJsonPath)
        .pipe(jeditor(function (obj) {
            obj.pipeline.publish.tag = [version, 'latest'];
            return obj;
        }))
        .pipe(gulp.dest(options.src))
        .on('err', cb)
        .on('end', cb);
}

function jsonToYaml(cb) {
    return gulp
        .src(options.droneJsonPath)
        .pipe(jsonToYaml_({ safe: true }))
        .pipe(rename(options.droneYmlFilename))
        .pipe(gulp.dest(options.src))
        .on('err', cb)
        .on('end', cb);
}

function deleteJson(cb) {
    return del([options.droneJsonPath])
        .then(function () { cb() })
        .catch(function (err) { if (err) cb(err) })
}

function git(cb) {
    return async.waterfall([
        pushTag
    ], cb)
}

function pushTag(cb) {
    if (options['push-tag'])
        return git_.push('origin', options['use-v-prefix'] ? 'v' + version : version, cb);
    else
        cb();
}