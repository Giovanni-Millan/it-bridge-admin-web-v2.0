import React, { useEffect, useState } from 'react'
import Navbar from '../../../components/Navbar';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Semestre6() {
    const [alumno,setAlumno]=useState([]);
  useEffect(()=>{
    axios.get('https://backend-bridge-production.up.railway.app/ConsultarAlumnosSemestre6')
    .then(res=>setAlumno(res.data))
    .catch(err=>console.log(err))
    console.log(alumno)
    
  },[])
  return (
    <main>
        <Navbar titulo="Semestre 1"/>

        <div className='mt-10'>  
            <Link to="/ConsultarGrupos" className='bg-purple-300 ml-16 p-4 text-purple-950 rounded-md hover:bg-purple-500'><FontAwesomeIcon icon={faArrowLeft} /></Link>
        </div>

        <section className='flex justify-center mt-14'>
                <table className=' bg-purple-100'>
                    <tr className='bg-purple-700 text-white text-center border-2 border-purple-300'>
                        <td className='px-5'>Nombre</td>
                        <td className='px-5'>Apellido paterno</td>
                        <td className='px-5'>Apellido materno</td>
                        <td className='px-5'>fecha de nacimiento</td>
                        <td className='px-5'>correo</td>
                        <td className='px-5'>telefono</td>
                        <td className='px-5'>semestre</td>
                    </tr>
                {
                    alumno.map((data,i)=>(
                    <tr key={i} className='border-2 m-2'>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.nombre} </td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.apellido_paterno}</td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.apellido_materno}</td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.fecha_nacimiento}</td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.correo}</td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.telefono} </td>
                        <td className='border-2 border-purple-300 text-center p-2'>{data.semestre} </td>
                    </tr>          
                    ))
                }
                </table>
        </section>



    </main>
  )
}
