import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Field from "../components/Field";
import UniversitySelect from "../components/UniversitySelect";
import { isAdult, maxDobFor18 } from "../utils";
import { NONE_ID } from "../universities";
import { btnBlock, btnPrimary, formError } from "../ui";

const initial = {
  display_name: "",
  email: "",
  password: "",
  date_of_birth: "",
  gender: "",
  looking_for: "",
  university: "", // must be chosen: a university id or "none"
  course: "",
  year_of_study: "",
  bio: "",
};

function validate(v) {
  const e = {};
  if (v.display_name.trim().length < 2) e.display_name = "Enter your name (at least 2 characters).";
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = "Enter a valid email address.";
  if (v.password.length < 8) e.password = "Use at least 8 characters.";
  if (!v.date_of_birth) e.date_of_birth = "Enter your date of birth.";
  else if (!isAdult(v.date_of_birth)) e.date_of_birth = "You must be 18 or older.";
  if (!v.gender) e.gender = "Choose your gender.";
  else if (v.gender !== "male" && v.gender !== "female") e.gender = "Profile can only be male or female.";
  if (!v.looking_for) e.looking_for = "Choose one.";
  if (!v.university) e.university = "Choose your university or college, or None if you're not at one.";
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formErrorMsg, setFormErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const hasUni = v.university && v.university !== NONE_ID;

  async function submit(e) {
    e.preventDefault();
    setFormErrorMsg("");
    const errs = validate(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await register({
        display_name: v.display_name.trim(),
        email: v.email.trim(),
        password: v.password,
        date_of_birth: v.date_of_birth,
        gender: v.gender,
        looking_for: v.looking_for,
        university: v.university,
        course: hasUni && v.course.trim() ? v.course.trim() : null,
        year_of_study: hasUni && v.year_of_study ? Number(v.year_of_study) : null,
        bio: v.bio.trim(),
      });
      nav("/", { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      setFormErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Tell us where you study. It's shown on your profile."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <Field label="Your name" htmlFor="display_name" error={errors.display_name}>
          <input id="display_name" value={v.display_name} onChange={set("display_name")} autoComplete="name" maxLength={40} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" value={v.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <input id="password" type="password" value={v.password} onChange={set("password")} autoComplete="new-password" />
        </Field>

        <div className="flex flex-col gap-0 min-[721px]:flex-row min-[721px]:gap-3">
          <Field label="Date of birth" htmlFor="dob" error={errors.date_of_birth}>
            <input id="dob" type="date" max={maxDobFor18()} value={v.date_of_birth} onChange={set("date_of_birth")} />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender} hint="Must be male or female">
            <select id="gender" value={v.gender} onChange={set("gender")}>
              <option value="" disabled>Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
        </div>
        <Field label="Interested in" htmlFor="looking_for" error={errors.looking_for}>
          <select id="looking_for" value={v.looking_for} onChange={set("looking_for")}>
            <option value="" disabled>Select</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="everyone">Everyone</option>
          </select>
        </Field>

        <div className="mb-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-orange-50/30 p-4 shadow-xs">
          <Field
            label="University or college"
            htmlFor="university"
            error={errors.university}
            hint="Required. Not at a university or college? Choose None."
          >
            <UniversitySelect value={v.university} onChange={(val) => setV((s) => ({ ...s, university: val }))} />
          </Field>
          {hasUni && (
            <div className="flex flex-col gap-0 min-[721px]:flex-row min-[721px]:gap-3">
              <Field label="Course (optional)" htmlFor="course">
                <input id="course" value={v.course} onChange={set("course")} maxLength={60} />
              </Field>
              <Field label="Year (optional)" htmlFor="year">
                <select id="year" value={v.year_of_study} onChange={set("year_of_study")}>
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>

        <Field label="About you (optional)" htmlFor="bio">
          <textarea id="bio" rows={3} maxLength={300} value={v.bio} onChange={set("bio")} className="resize-y" />
        </Field>

        {formErrorMsg && <p className={formError} role="alert">{formErrorMsg}</p>}
        <button className={`${btnPrimary} ${btnBlock}`} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
