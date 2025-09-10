import { useState, useEffect } from "react";
import axios from "axios";

import DraggableActivityCard from "../components/DraggableActivityCard.jsx";

export default function Weekend() {
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
      <main className="p-10 ">
        <div className="flex w-full flex-col lg:flex-row">
          <div className="card w-1/3 bg-base-300 rounded-box  min-h-160 h-screen grow place-items-center">
            <div className="h-1/12 w-full flex justify-between rounded-t-box items-center bg-accent p-4">
              <h1 className="text-primary-content text-2xl font-bold">
                Activity Library
              </h1>
            </div>
            <div className="flex flex-col gap-4 justify-between h-11/12 items-center p-4 overflow-y-auto ">
              {activities?.items.map((item, index) => (
                <DraggableActivityCard
                  key={index}
                  data={item}
                ></DraggableActivityCard>
              ))}
            </div>
          </div>
          <div className="divider lg:divider-horizontal"></div>
          <div className="card w-2/3 bg-base-300 rounded-box grid min-h-160 h-auto  grow place-items-center p-10">
            <div className="flex w-full flex-col lg:flex-row">
              <div className="card  bg-base-200 rounded-box grid min-h-160 h-auto grow place-items-center">
                Saturday
              </div>
              <div className="divider divider-accent lg:divider-horizontal "></div>
              <div className="card  bg-base-200 rounded-box grid min-h-160 h-auto  grow place-items-center">
                Sunday
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
