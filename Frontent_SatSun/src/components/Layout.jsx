import { Children } from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout({children}){
    return(
        <>
        <div>
            {/* <nav> */}
                <Navbar></Navbar>
            {/* </nav> */}
            <main>{children}</main>
            
                <Footer></Footer>
            
        </div>
        
        
        </>
    )
}