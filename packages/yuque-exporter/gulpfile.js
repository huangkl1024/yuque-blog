const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

gulp.task("copy-ejs", function () {
  return gulp.src(["src/ejs/*.ejs"]).pipe(gulp.dest("dist/ejs"));
});

gulp.task("build", function () {
  return tsProject.src()
    .pipe(tsProject()).js.pipe(gulp.dest("dist"));
});
