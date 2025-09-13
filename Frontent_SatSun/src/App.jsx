import React from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import Login from "./pages/Login";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Register from "./pages/Register";

import WeekendPlannar from "./pages/WeekendPlannar";
  import Calender from "./pages/Calender";
  import Timeline from "./pages/Timeline";
  import Activity from "./pages/Activity";

  function RequireAuth({ children }) {
    const isLoggedIn = !!localStorage.getItem("user");
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    return children;
  }

  const App = () => {
    return (
      <>
        {" "}
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              ></Route>

              <Route
                path="/weekend-planner"
                element={
                  <RequireAuth>
                    <WeekendPlannar />
                  </RequireAuth>
                }
              />

              <Route
                path="/calendar"
                element={
                  <RequireAuth>
                    <Calender />
                  </RequireAuth>
                }
              />
              <Route
                path="/timeline"
                element={
                  <RequireAuth>
                    <Timeline />
                  </RequireAuth>
                }
              />
              <Route
                path="/activities"
                element={
                  <RequireAuth>
                    <Activity />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Login />}></Route>
              <Route path="/register" element={<Register />}></Route>
            </Routes>
          </Layout>
        </BrowserRouter>
      </>
    );
  };

export default App;
