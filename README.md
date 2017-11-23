**Usage**

``
var increment = require('gulp-increment-version');
``

``
gulp.task('increment-version', increment.task);
``

**What it does**

1. Increment version in package.json
2. Increment tag in .drone.yml
3. Increment git tag and push it to origin

**Configuration**

``
increment.config({
    type: patch | minor | major | prerelease
});
``

**TODO**
1. Automatise the distribution flow entirely:
    - Discard all changes? (app.constant.js etc?) or Stash all changes!
    - Stage everything and commit
    - Check out dev
    - Push local dev to remote dev
    - Merge dev into master
    - Push local master to remote master

