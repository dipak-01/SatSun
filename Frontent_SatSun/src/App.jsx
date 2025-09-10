import React from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import Login from "./pages/Login";
import { BrowserRouter,Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Weekend from "./pages/Weekend";

const App = () => {
  return (
    <>
      {" "}
      <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />}></Route>
          <Route path="/weekend" element={<Weekend />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/register" element={<Register />}></Route>
        </Routes>
      </Layout></BrowserRouter>
    </>
  );
};

export default App;
