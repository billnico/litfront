import { Link } from "react-router-dom";
import { useInbox } from "../context/InboxContext";
import { useUniversities } from "../hooks/useUniversities";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import { btnGhost, btnPrimary } from "../ui";

export default function Matches() {
  const { matches, loaded } = useInbox();
  const { label } = useUniversities();

  if (!loaded) return <div className="grid place-items-center py-16"><Spinner /></div>;

  if (matches.length === 0) {
    return (
      <div className="px-4 pb-12 pt-6">
        <div className="grid justify-items-center gap-3.5 px-4 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
            <Icon name="heart" size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">No matches yet</h2>
          <p className="max-w-xs text-xs text-slate-500">
            When you and another student like each other, they'll appear here and in your direct messages.
          </p>
          <Link className={`${btnPrimary} mt-2`} to="/">Start discovering</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 pb-14 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Your Matches</h1>
          <p className="mt-1 text-xs text-slate-500">
            {matches.length} mutual match{matches.length === 1 ? "" : "es"} across Malawi campuses
          </p>
        </div>
        <Link to="/messages" className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-[#ff4458] hover:bg-rose-100 transition-colors">
          <Icon name="message" size={14} />
          <span>Go to Messages</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {matches.map((m) => {
          const hasChat = !!m.last_message;
          const genderDisplay = m.user.gender === "female" || m.user.gender === "woman" ? "Female" : "Male";

          return (
            <div
              key={m.id}
              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:shadow-lg"
            >
              <div>
                <div className="relative mb-3 flex items-center gap-3.5">
                  <Avatar user={m.user} size={60} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">{m.user.display_name}</h3>
                    <p className="truncate text-xs font-semibold text-[#ff4458]">{label(m.user.university, true)}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
                      {genderDisplay}
                    </span>
                  </div>
                </div>
                {m.user.bio && (
                  <p className="mb-4 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {m.user.bio}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Link
                  to={`/chat/${m.id}`}
                  className={`${hasChat ? btnPrimary : btnGhost} w-full !py-2.5 !text-xs !font-bold flex items-center justify-center gap-2`}
                >
                  <Icon name="chat" size={15} />
                  <span>{hasChat ? "Direct Message" : "Say Hello"}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
