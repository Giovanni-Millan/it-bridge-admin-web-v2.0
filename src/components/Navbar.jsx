import React from 'react'
import './navbar.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';


import logo from '../assets/logo.png'
import { auth } from './firebase';


export default function Navbar(props) {

    
  return (
    <nav className='bg-purple-950 flex justify-between items-center py-3'>
        <div>
            <img src={logo} className='logo ml-5 bg-white rounded-full p-1' />
        </div>

        <div className='text-white font-thin text-3xl'>
            {props.titulo}
        </div>

        <div>
          
        </div>
    </nav>
  )
}
