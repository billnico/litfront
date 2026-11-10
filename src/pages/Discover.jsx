import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useInbox } from "../context/InboxContext";
import { useUniversities } from "../hooks/useUniversities";
import UniversitySelect from "../components/UniversitySelect";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import { NONE_ID } from "../universities";
import { formatFee, isSubscribed } from "../billing";
import { btnBlock, btnDark, btnGhost, btnPrimary, formError } from "../ui";

function FeedPersonCard({ person, onAct, isActing }) {
  const { label } = useUniversities();
  const genderLabel = person.gender === "female" || person.gender === "woman" ? "Female" : "Male";
  const avatar_url = person?.avatar_url;
  const [imgError, setImgError] = useState(false);

  return (
    <article className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-card transition-all duration-300 hover:shadow-lg">
      <div className="relative grid aspect-[4/4] sm:aspect-[4/4.2] place-items-center overflow-hidden bg-[linear-gradient(145deg,#ff4458_0%,#c026d3_40%,#0f172a_100%)]">
        {avatar_url && !imgError ? (
          <img
            src={avatar_url}
            alt={person.display_name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-[5.5rem] font-black tracking-tight text-white/90 drop-shadow-md">
            {person.display_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-5 pb-5 pt-16 text-white">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {person.display_name}
            </h2>
            <span className="text-xl font-normal opacity-90">{person.age}</span>
            <span className="ml-auto rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-white">
              {genderLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 pt-4 pb-4">
        <span className="inline-flex items-center justify-self-start gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          <Icon name="cap" size={14} className="text-rose-400" /> {label(person.university)}
        </span>
        {person.university !== NONE_ID && (person.course || person.year_of_study) && (
          <p className="text-xs font-medium text-slate-500">
            {[person.course, person.year_of_study && `Year ${person.year_of_study}`].filter(Boolean).join(" · ")}
          </p>
        )}
        {person.bio && (
          <p className="text-sm leading-relaxed text-slate-700">
            {person.bio}
          </p>
        )}
      </div>

      {/* Action bar for endless feed */}
      <div className="flex items-center justify-center gap-8 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <button
          className="group flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:enabled:scale-110 hover:enabled:border-slate-300 hover:enabled:bg-rose-50/50 hover:enabled:text-rose-500 active:scale-95 disabled:opacity-50"
          onClick={() => onAct(person.id, "pass")}
          disabled={isActing}
          aria-label={`Pass on ${person.display_name}`}
          title="Pass"
        >
          <Icon name="x" size={24} className="transition-transform group-hover:rotate-12" />
        </button>
        <button
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4458] to-[#ff6b6b] text-white shadow-md shadow-rose-500/30 transition-all hover:enabled:scale-110 hover:enabled:shadow-lg hover:enabled:shadow-rose-500/40 active:scale-95 disabled:opacity-50"
          onClick={() => onAct(person.id, "like")}
          disabled={isActing}
          aria-label={`Like ${person.display_name}`}
          title="Like"
        >
          <Icon name="heart" size={26} style={{ fill: "currentColor" }} className="transition-transform group-hover:scale-110" />
        </button>
      </div>
    </article>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const inbox = useInbox();
  const subscribed = isSubscribed(user);

  const [filter, setFilter] = useState("all");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [match, setMatch] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const cursorRef = useRef(null);
  const fetchingRef = useRef(false);
  const seqRef = useRef(0);
  const sentinelRef = useRef(null);

  // Monitor scroll for back-to-top button
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 500);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadPage = useCallback(
    async (reset = false) => {
      if (!subscribed) return;
      if (fetchingRef.current) return;

      const currentSeq = reset ? ++seqRef.current : seqRef.current;
      fetchingRef.current = true;

      if (reset) {
        setLoading(true);
        cursorRef.current = null;
      } else {
        setLoadingMore(true);
      }

      setError("");

      try {
        const res = await api.discover({
          university: filter === "all" ? undefined : filter,
          cursor: reset ? undefined : cursorRef.current ?? undefined,
          limit: 6,
        });

        if (currentSeq !== seqRef.current) return;

        cursorRef.current = res.next_cursor ?? null;
        setHasMore(Boolean(res.next_cursor));

        setProfiles((prev) => {
          const base = reset ? [] : prev;
          const seenIds = new Set(base.map((p) => p.id));
          const newItems = (res.items || []).filter((p) => !seenIds.has(p.id));
          return [...base, ...newItems];
        });
      } catch (err) {
        if (currentSeq === seqRef.current) {
          setError(err.message || "Failed to load profiles");
        }
      } finally {
        if (currentSeq === seqRef.current) {
          fetchingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, subscribed]
  );

  // Initial load or filter change
  useEffect(() => {
    if (!subscribed) {
      setLoading(false);
      return;
    }
    setProfiles([]);
    setHasMore(true);
    cursorRef.current = null;
    loadPage(true);
  }, [filter, subscribed, loadPage]);

  // Endless scrolling IntersectionObserver
  useEffect(() => {
    if (!subscribed || loading || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !fetchingRef.current && hasMore) {
          loadPage(false);
        }
      },
      { rootMargin: "450px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [subscribed, loading, hasMore, loadPage]);

  // Handle Swipe (Like or Pass)
  async function act(targetId, action) {
    if (actingId) return;
    setActingId(targetId);
    setError("");

    try {
      const res = await api.swipe(targetId, action);
      // Remove target card from feed
      setProfiles((prev) => prev.filter((p) => p.id !== targetId));

      if (res.matched) {
        setMatch(res.match);
        inbox.refresh();
      }

      // If feed is running low after removing cards, trigger next page
      if (hasMore && !fetchingRef.current && profiles.length <= 3) {
        loadPage(false);
      }
    } catch (err) {
      setError(err.message || "Failed to submit choice.");
    } finally {
      setActingId(null);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Only subscribed users can discover profiles
  if (!subscribed) {
    return (
      <div className="flex flex-col items-center px-4 pb-14 pt-8">
        <div className="w-full max-w-[460px] overflow-hidden rounded-3xl border border-rose-200/80 bg-white p-7 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-tr from-[#ff4458] to-[#ff7b54] text-white shadow-lg shadow-rose-500/30">
            <Icon name="card" size={28} />
          </div>
          <span className="mt-4 inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff4458]">
            Subscribers Only
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Discover Campus Matches
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Only subscribed users can discover profiles and match with students across campuses. Subscribe today to start browsing and matching!
          </p>

          <div className="my-5 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-left">
            <p className="text-xs font-bold text-slate-800">With lit Subscription:</p>
            <ul className="mt-2.5 grid gap-2 text-xs font-medium text-slate-600">
              <li className="flex items-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-100 text-[0.65rem] font-black text-[#ff4458]">✓</span>
                Endless scrolling discovery across all Malawi universities
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-100 text-[0.65rem] font-black text-[#ff4458]">✓</span>
                Unlimited direct messages and instant matches
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-100 text-[0.65rem] font-black text-[#ff4458]">✓</span>
                Only {formatFee()} for 30 full days access
              </li>
            </ul>
          </div>

          <Link to="/subscribe" className={`${btnPrimary} ${btnBlock}`}>
            Subscribe to discover profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pb-16 pt-6">
      {/* Filter Header */}
      <div className="sticky top-[68px] z-10 mb-6 w-full max-w-[480px] rounded-2xl bg-white/95 p-2 shadow-sm backdrop-blur-md border border-slate-200/80">
        <label htmlFor="filter" className="sr-only">Filter by university</label>
        <UniversitySelect
          id="filter"
          value={filter}
          onChange={(newVal) => {
            setFilter(newVal);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          allowAll
          noneLabel="No university"
          className="w-full !rounded-xl shadow-xs"
        />
      </div>

      {error && <p className={`${formError} mb-4 w-full max-w-[480px]`} role="alert">{error}</p>}

      {/* Initial Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Spinner />
          <p className="mt-3 text-xs font-semibold">Finding students…</p>
        </div>
      ) : profiles.length > 0 ? (
        /* Endless Scrolling Feed */
        <div className="flex w-full flex-col items-center gap-7">
          {profiles.map((person) => (
            <FeedPersonCard
              key={person.id}
              person={person}
              onAct={act}
              isActing={actingId === person.id}
            />
          ))}

          {/* Endless Scroll Sentinel */}
          <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />

          {/* Bottom Loading Indicator */}
          {loadingMore && (
            <div className="flex items-center gap-2.5 py-6 text-slate-500">
              <Spinner />
              <span className="text-xs font-semibold">Loading more profiles…</span>
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && (
            <div className="mt-4 flex max-w-[420px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                <Icon name="spark" size={22} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">You're all caught up!</h3>
              <p className="mt-1 text-xs text-slate-500">
                You've seen all profiles currently available for this selection.
              </p>
              {filter !== "all" && (
                <button
                  className={`${btnDark} mt-4 !text-xs !py-2.5`}
                  onClick={() => {
                    setFilter("all");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Explore all universities
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="grid justify-items-center gap-3 px-4 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
            <Icon name="heart" size={30} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">You're all caught up</h2>
          <p className="max-w-xs text-xs text-slate-500 leading-relaxed">
            No more people for this filter right now. Try selecting another campus or check back later!
          </p>
          {filter !== "all" && (
            <button
              className={`${btnDark} mt-2`}
              onClick={() => {
                setFilter("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Show all universities
            </button>
          )}
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Back to top"
          title="Back to top"
        >
          <Icon name="arrowUp" size={20} />
        </button>
      )}

      {/* Match Modal */}
      {match && (
        <Modal title="It's a match" onClose={() => setMatch(null)}>
          <div className="grid gap-2 text-center">
            <div className="mb-3 flex justify-center [&>*:not(:first-child)]:-ml-[20px] [&_img]:border-4 [&_img]:border-white [&>div]:border-4 [&>div]:border-white [&_img]:shadow-md [&>div]:shadow-md">
              <Avatar user={user} size={88} />
              <Avatar user={match.user} size={88} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#ff4458]">It's a match!</h2>
            <p className="text-sm text-slate-600">You and {match.user.display_name} liked each other.</p>
            <div className="mt-4 grid gap-2">
              <Link className={`${btnPrimary} ${btnBlock}`} to={`/chat/${match.id}`} onClick={() => setMatch(null)}>
                Send a message
              </Link>
              <button className={`${btnGhost} ${btnBlock}`} onClick={() => setMatch(null)}>
                Keep scrolling
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
