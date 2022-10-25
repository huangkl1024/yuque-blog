const gulp = require("gulp");

gulp.task("copy-ejs", function () {
  return gulp.src(["src/ejs/*.ejs"]).pipe(gulp.dest("build/main/ejs"));
});
