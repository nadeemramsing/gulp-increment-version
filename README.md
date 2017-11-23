**Usage**

``
var gulpIncrement = require('gulp-increment-version');
``

``
gulp.task('increment-version', gulpIncrement.task);
``

**What it does**

1. Increment version in package.json
2. Increment tag in .drone.yml
3. Increment git tag and push it to origin

**Configuration**

``
gulpIncrement.config({
    ``
    type: patch | minor | major | prerelease
    ``
});
``