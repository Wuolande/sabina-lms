/** Shown above the login form. */
export function LoginIntro() {
  return (
    <div className="ep-login-intro">
      <h1>Welcome back</h1>
      <p>Sign in to run Sabina: tutors, students, lessons, payments and content.</p>
    </div>
  );
}

export function LoginFoot() {
  return (
    <p className="ep-login-foot">
      This sign-in is for Sabina staff. Tutors and students sign in at <a href="/login">sabina.education/login</a>.
    </p>
  );
}
