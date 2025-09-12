import React from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import Login from "./pages/Login";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
 
import WeekendPlannar from "./pages/WeekendPlannar";
import Calender from "./pages/Calender";
import Timeline from "./pages/Timeline";
import Activity from "./pages/Activity";

const App = () => {
  return (
    <>
      {" "}
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />}></Route>

            <Route path="/weekend-planner" element={<WeekendPlannar />}></Route>
            <Route path="/calendar" element={<Calender />}></Route>
            <Route path="/timeline" element={<Timeline />}></Route>
            <Route path="/activities" element={<Activity />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/register" element={<Register />}></Route>
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
};

export default App;
