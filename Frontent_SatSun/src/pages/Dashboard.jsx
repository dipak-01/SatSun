import { useState, useEffect } from "react";
import ActivityCard from "../components/ActivityCard.jsx";
import axios from "axios";
import WeekendCard from "../components/WeekendCard.jsx";
import NewActicityModal from "../components/NewActivityModal.jsx";
import NewWeekendModal from "../components/NewWeekendModal.jsx";
export default function Dashboard() {
  const [weekends, setWeekends] = useState(null);
  const [activities, setActivities] = useState(null);
  useEffect(() => {
    // const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    // if (!token) {
    //   console.log("token not found");
    // }
    const userObj = (() => {
      try {
        return user ? JSON.parse(user) : null;
      } catch {
        return null;
      }
    })();
    console.log(userObj?.id);
    // console.log(token)

    const getWeekendsList = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/weekends?includeDays=true`,
          {
            withCredentials: true,
          }
        );
        console.log(res.data);
        setWeekends(res.data);
        console.log(weekends);
      } catch (error) {
        console.error("Failed to fetch the weekends data", error);
      }
    };
    const getActivitiesList = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/activities`,
          {
            withCredentials: true,
          }
        );
        console.log(res.data);
        setActivities(res.data);
        console.log(activities);
      } catch (error) {
        console.error("Failed to fetch the activities data", error);
      }
    };
    getWeekendsList();
    getActivitiesList();
  }, []);

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-left">
          Upcoming Activities
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById("my_modal_5").showModal()}
        >
          Add Activity
        </button>
        <NewActicityModal />
      </header>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {activities?.items?.length ? (
          activities.items.map((item, index) => (
            <ActivityCard key={index} data={item} />
          ))
        ) : (
          <div className="text-sm opacity-70">No activities yet.</div>
        )}
      </div>

      <div className="divider" />

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-left">
          Upcoming Weekends
        </h2>
        <button
          onClick={() => document.getElementById("my_modal_4").showModal()}
          className="btn btn-primary"
        >
          New Weekend
        </button>
        <NewWeekendModal />
      </header>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {weekends?.length ? (
          weekends.map((item, index) => <WeekendCard key={index} data={item} />)
        ) : (
          <div className="text-sm opacity-70">No weekends planned yet.</div>
        )}
      </div>
    </section>
  );
}
