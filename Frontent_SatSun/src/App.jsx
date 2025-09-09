// import { useState } from "react";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import Demo from "./components/Demo"

import "./App.css";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
      <Theme
      accentColor="yellow" grayColor="sand" radius="large" appearance="dark">
        <div>Welcome to the App!</div>
        <Demo/>
      </Theme>
    </>
  );
}

export default App;
 