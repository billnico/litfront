import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import Field from "../components/Field";
import Icon from "../components/Icon";
import UniversitySelect from "../components/UniversitySelect";
import { NONE_ID } from "../universities";
import { btnBlock, btnGhost, btnPrimary, formError, note } from "../ui";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [v, setV] = useState({
    display_name: user.display_name || "",
    gender: (user.gender === "female" || user.gender === "woman") ? "female" : "male",
    bio: user.bio || "",
    looking_for: user.looking_for || "everyone",
    university: user.university || "", // empty only for legacy accounts; must be chosen to save
    course: user.course || "",
    year_of_study: user.year_of_study ? String(user.year_of_study) : "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const set = (k) => (e) => {
    setSaved(false);
    setV((s) => ({ ...s, [k]: e.target.value }));
  };
  const hasUni = v.university && v.university !== NONE_ID;

  async function submit(e) {
    e.preventDefault();
    setServerError("");
    setSaved(false);
    const errs = {};
    if (v.display_name.trim().length < 2) errs.display_name = "Enter your name (at least 2 characters).";
    if (!v.university) errs.university = "Choose your university or college, or None if you're not at one.";
    if (!v.gender || (v.gender !== "male" && v.gender !== "female")) {
      errs.gender = "Profile can only be male or female.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const updated = await api.me.update({
        display_name: v.display_name.trim(),
        gender: v.gender,
        bio: v.bio.trim(),
        looking_for: v.looking_for,
        university: v.university,
        course: hasUni && v.course.trim() ? v.course.trim() : null,
        year_of_study: hasUni && v.year_of_study ? Number(v.year_of_study) : null,
      });
      setUser(updated);
      setSaved(true);
      if (params.get("complete")) nav("/", { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setServerError("Choose an image under 5 MB.");
      return;
    }
    setPhotoBusy(true);
    setServerError("");
    try {
      setUser(await api.me.uploadPhoto(file));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 pb-14 pt-8">
      {params.get("complete") && (
        <p className={note}>Before you continue, tell us where you study. Choose your university or college, or None.</p>
      )}

      <div className="mb-6 flex items-center gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="relative">
          <Avatar user={user} size={92} />
          <label className="absolute -bottom-1 -right-1 grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border-2 border-white bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] text-white shadow-md hover:scale-105 transition-transform" aria-label="Change photo">
            <Icon name="camera" size={16} />
            <input className="absolute inset-0 h-full w-full cursor-pointer p-0 opacity-0" type="file" accept="image/*" onChange={onPhoto} disabled={photoBusy} />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{user.display_name}</h1>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#ff4458]">
              {v.gender === "female" ? "Female" : "Male"}
            </span>
          </div>
          <p className="truncate text-xs font-medium text-slate-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <Field label="Name" htmlFor="display_name" error={errors.display_name}>
          <input id="display_name" value={v.display_name} onChange={set("display_name")} maxLength={40} />
        </Field>

        <div className="flex flex-col gap-0 sm:flex-row sm:gap-3">
          <Field label="Profile Gender" htmlFor="gender" error={errors.gender} hint="Must be male or female">
            <select id="gender" value={v.gender} onChange={set("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Interested in" htmlFor="looking_for">
            <select id="looking_for" value={v.looking_for} onChange={set("looking_for")}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="everyone">Everyone</option>
            </select>
          </Field>
        </div>

        <div className="mb-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-orange-50/30 p-4 shadow-xs">
          <Field label="University or college" htmlFor="university" error={errors.university} hint="Required. Choose None if you're not at one.">
            <UniversitySelect value={v.university} onChange={(val) => { setSaved(false); setV((s) => ({ ...s, university: val })); }} />
          </Field>
          {hasUni && (
            <div className="flex flex-col gap-0 sm:flex-row sm:gap-3">
              <Field label="Course" htmlFor="course">
                <input id="course" value={v.course} onChange={set("course")} maxLength={60} />
              </Field>
              <Field label="Year" htmlFor="year">
                <select id="year" value={v.year_of_study} onChange={set("year_of_study")}>
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>

        <Field label="About you" htmlFor="bio">
          <textarea id="bio" rows={4} maxLength={300} value={v.bio} onChange={set("bio")} className="resize-y" />
        </Field>

        {serverError && <p className={formError} role="alert">{serverError}</p>}
        {saved && <p className={note} role="status">Changes saved successfully.</p>}
        <button className={`${btnPrimary} ${btnBlock}`} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <button className={`${btnGhost} ${btnBlock} mt-4 !border-red-200 !text-red-600 hover:!bg-red-50`} onClick={async () => { await logout(); nav("/login", { replace: true }); }}>
        Log out
      </button>
    </div>
  );
}
