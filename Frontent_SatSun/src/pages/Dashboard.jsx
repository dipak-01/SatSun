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
    <>
      <main className="p-10">
        <div className="flex w-full flex-col">
          <div className="flex justify-between items-center">
            <h2 className="text-start text-4xl font-bold  ">
              Upcoming Activities
            </h2>
            <button
              className="btn btn-accent"
              onClick={() => document.getElementById("my_modal_5").showModal()}
            >
              Add New Activity{" "}
            </button>
            <NewActicityModal></NewActicityModal>
          </div>
          <div className="flex gap-4 overflow-x-auto py-4">
            {activities?.items.map((item, index) => (
              <ActivityCard key={index} data={item}></ActivityCard>
            ))}
          </div>

          <div className="divider py-4"></div>
          <div className="flex justify-between items-center">
            <h2 className="text-start text-4xl font-bold  ">
              Upcoming Weekends
            </h2>
            <button onClick={() => document.getElementById("my_modal_4").showModal()} className="btn btn-accent">Add New Weekend </button>
            <NewWeekendModal></NewWeekendModal>
          </div>
          <div className="flex gap-4 overflow-x-auto py-4">
            {weekends?.map((item, index) => (
              <WeekendCard key={index} data={item}></WeekendCard>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
