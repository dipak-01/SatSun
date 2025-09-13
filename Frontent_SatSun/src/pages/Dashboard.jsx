import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Calendar, Plus, PartyPopper, Sparkles, Info } from "lucide-react";
import ActivityCard from "../components/ActivityCard.jsx";
import WeekendCard from "../components/WeekendCard.jsx";
import NewActicityModal from "../components/NewActivityModal.jsx";
import NewWeekendModal from "../components/NewWeekendModal.jsx";

function Dashboard() {
  const [weekends, setWeekends] = useState(null);
  const [activities, setActivities] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Parse user for future personalization (intentionally unused)
    try {
      const raw = localStorage.getItem("user");
      const _USER = raw ? JSON.parse(raw) : null;
      void _USER; // parsed for potential personalization
    } catch {
      // ignore parse errors
    }

    const getWeekendsList = async () => {
      try {
        const res = await api.get(`weekends`, {
          params: { includeDays: true },
        });
        setWeekends(res.data);
      } catch (err) {
        console.error("Failed to fetch the weekends data", err);
        setError("Could not load weekends. Please try again.");
      }
    };

    const getActivitiesList = async () => {
      try {
        const res = await api.get(`activities`);
        setActivities(res.data);
      } catch (err) {
        console.error("Failed to fetch the activities data", err);
        setError((e) => e || "Could not load activities. Please try again.");
      }
    };

    getWeekendsList();
    getActivitiesList();
  }, []);

  const counts = useMemo(
    () => ({
      weekends: Array.isArray(weekends) ? weekends.length : 0,
      activities: activities?.items?.length ?? 0,
    }),
    [weekends, activities]
  );

  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities?.items || []) m.set(a.id, a);
    return m;
  }, [activities]);

  const isLoading = weekends === null || activities === null;

  return (
    <section className="space-y-10">
      {/* Hero section */}
      <div className="hero min-h-[52vh] rounded-box bg-gradient-to-br from-primary/40 via-accent/20 to-secondary/40 p-6">
        <div className="hero-content flex-col lg:flex-row-reverse gap-10">
          {/* Right side visuals */}
          <div className="w-full lg:w-2/5">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-base-content/80">
                  Your snapshot
                </h3>
                <div className="stats stats-vertical sm:stats-horizontal w-full shadow-none">
                  <div className="stat">
                    <div className="stat-figure text-primary">
                      <PartyPopper aria-hidden className="w-6 h-6" />
                    </div>
                    <div className="stat-title">Planned weekends</div>
                    <div className="stat-value text-primary">
                      {counts.weekends}
                    </div>
                    <div className="stat-desc">Ready to unwind</div>
                  </div>
                  <div className="stat">
                    <div className="stat-figure text-secondary">
                      <Sparkles aria-hidden className="w-6 h-6" />
                    </div>
                    <div className="stat-title">Activities</div>
                    <div className="stat-value text-secondary">
                      {counts.activities}
                    </div>
                    <div className="stat-desc">Ideas at hand</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left side copy and actions */}
          <div className="w-full lg:w-3/5">
            <p
              className="badge badge-soft badge-primary mb-4 w-fit"
              aria-label="Product tagline"
            >
              Plan delightful weekends
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Make your weekends count
            </h1>
            <p className="mt-4 text-base sm:text-lg text-base-content/70 max-w-prose">
              Create memorable plans in minutes. Organize activities, map your
              days, and share effortlessly—all in one place.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/weekend-planner"
                className="btn btn-primary btn-lg"
                aria-label="Open weekend planner"
              >
                <Calendar aria-hidden className="w-5 h-5" />
                <span>Open Planner</span>
              </Link>
              <button
                className="btn btn-soft btn-lg"
                onClick={() =>
                  document.getElementById("my_modal_4").showModal()
                }
                aria-label="Create a new weekend"
              >
                <Plus aria-hidden className="w-5 h-5" />
                <span>New Weekend</span>
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={() =>
                  document.getElementById("my_modal_5").showModal()
                }
                aria-label="Add a new activity"
              >
                <Sparkles aria-hidden className="w-5 h-5" />
                <span>Add Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error ? (
        <div role="alert" className="alert alert-warning">
          <Info aria-hidden className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Activities section */}
      <section aria-labelledby="activities-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2
            id="activities-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
          >
            Upcoming Activities
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById("my_modal_5").showModal()}
              aria-label="Add activity"
            >
              <Sparkles aria-hidden className="w-5 h-5" />
              <span>Add Activity</span>
            </button>
            <Link
              to="/activities"
              className="btn btn-ghost"
              aria-label="Go to all activities"
            >
              See all
            </Link>
          </div>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
          aria-live="polite"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton w-72 h-44 rounded-box shrink-0"
                aria-hidden
              />
            ))
          ) : activities?.items?.length ? (
            activities.items.map((item, index) => (
              <div key={index} className="snap-start shrink-0">
                <ActivityCard data={item} />
              </div>
            ))
          ) : (
            <div className="text-sm opacity-70">No activities yet.</div>
          )}
        </div>
      </section>

      <div className="divider" />

      {/* Weekends section */}
      <section aria-labelledby="weekends-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2
            id="weekends-heading"
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
          >
            Upcoming Weekends
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => document.getElementById("my_modal_4").showModal()}
              className="btn btn-primary"
              aria-label="Create new weekend"
            >
              <PartyPopper aria-hidden className="w-5 h-5" />
              <span>New Weekend</span>
            </button>
            <Link
              to="/calendar"
              className="btn btn-ghost"
              aria-label="Open calendar"
            >
              Calendar
            </Link>
          </div>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
          aria-live="polite"
        >
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="skeleton w-80 h-56 rounded-box shrink-0"
                aria-hidden
              />
            ))
          ) : weekends?.length ? (
            weekends.map((item, index) => (
              <div key={index} className="snap-start shrink-0">
                <WeekendCard data={item} activityMap={activityMap} />
              </div>
            ))
          ) : (
            <div className="text-sm opacity-70">No weekends planned yet.</div>
          )}
        </div>
      </section>

      {/* Modals */}
      <NewActicityModal />
      <NewWeekendModal />
    </section>
  );
}

export default Dashboard;
