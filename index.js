var gulp = require('gulp'),
    async = require('async'),
    path = require('path'),

    tag = require('gulp-tag-version'),

    bump_ = require('gulp-bump'),
    git_ = require('gulp-git'),
    yamlToJson_ = require('gulp-yaml'),
    jsonToYaml_ = require('gulp-json-to-yaml'),

    jsonfile = require('jsonfile'),
    jeditor = require('gulp-json-editor'),
    rename = require('gulp-rename'),
    del = require('del');

var options = {
    packageFilename: 'package.json',
    droneYmlFilename: '.drone.yml',
    droneJsonFilename: '.drone.json',
    src: upPath(''),
    type: 'patch'
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
    if (Object.keys(options).length !== 0) {
        options = Object.assign(options, options_);
        handleOptions(options);
    }

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
        parallelGitDrone,
        git
    ],
        function (err) {
            if (err)
                console.error(err);

            if (cb)
                cb(err);
        });
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

function parallelGitDrone(cb) {
    return async.parallel([
        incrementGit,
        incrementDrone
    ], cb);
}

function incrementGit(cb) {
    return gulp
        .src([options.packagePath])
        .pipe(tag())
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
    return git_.push('origin', 'v' + version, function (err) {
        if (err)
            console.error(err);
    });
}