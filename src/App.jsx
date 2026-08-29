import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'

import "./App.css";

import Dashboard from './pages/Dashboard/Dashboard'
import CambiarPassword from "./pages/Dashboard/CambiarPassword";
import Candados from "./pages/Candados/Candados";
import CrearAvisos from './pages/CrearAvisos/CrearAvisos'
import InscribirAlumnos from './pages/InscribirAlumnos/InscribirAlumnos'
import ConsultarGrupos from './pages/ConsultarGrupos/ConsultarGrupos'
import ConsultarUsuarios from './pages/ConsultarUsuarios/ConsultarUsuarios'
import EditarUsuario from './pages/ConsultarUsuarios/EditarUsuario'
import ListarAlumnosHistorial from './pages/HistorialAcademico/ListarAlumnosHistorial'
import DetalleHistorialAcademico from './pages/HistorialAcademico/DetalleHistorialAcademico'



// * CONSULTAR GRUPOS ---------------------------------------------------------------------------------

//Escolarizado
import Sistemas_grupo from './pages/GrupoConsultado/escolarizado/Sistemas_grupo.jsx'
import Derecho_grupo from './pages/GrupoConsultado/escolarizado/Derecho_grupo.jsx'
import Pedagogia_grupo from './pages/GrupoConsultado/escolarizado/Pedagogia_grupo.jsx'
import Psicologia_grupo from './pages/GrupoConsultado/escolarizado/Psicologia_grupo.jsx'
import Administracion_grupo from './pages/GrupoConsultado/escolarizado/Administracion_grupo.jsx'
import Deporte_grupo from './pages/GrupoConsultado/escolarizado/Deporte_grupo.jsx'
import Contaduria_grupo from './pages/GrupoConsultado/escolarizado/Contaduria_grupo.jsx'
import Criminologia_grupo from './pages/GrupoConsultado/escolarizado/Criminologia_grupo.jsx'
import Trabajo_grupo from './pages/GrupoConsultado/escolarizado/Trabajo_grupo.jsx'
import Industrial_grupo from './pages/GrupoConsultado/escolarizado/Industrial_grupo.jsx'

//Sabatino
import Sistemas_grupo_sabatino from './pages/GrupoConsultado/sabatino/Sistemas_grupo_sabatino.jsx'
import Derecho_grupo_sabatino from './pages/GrupoConsultado/sabatino/Derecho_grupo_sabatino.jsx'
import Pedagogia_grupo_sabatino from './pages/GrupoConsultado/sabatino/Pedagogia_grupo_sabatino.jsx'
import Psicologia_grupo_sabatino from './pages/GrupoConsultado/sabatino/Psicologia_grupo_sabatino.jsx'
import Administracion_grupo_sabatino from './pages/GrupoConsultado/sabatino/Administracion_grupo_sabatino.jsx'
import Deporte_grupo_sabatino from './pages/GrupoConsultado/sabatino/Deporte_grupo_sabatino.jsx'
import Contaduria_grupo_sabatino from './pages/GrupoConsultado/sabatino/Contaduria_grupo_sabatino.jsx'
import Criminologia_grupo_sabatino from './pages/GrupoConsultado/sabatino/Criminologia_grupo_sabatino.jsx'
import Trabajo_grupo_sabatino from './pages/GrupoConsultado/sabatino/Trabajo_grupo_sabatino.jsx'
import Industrial_grupo_sabatino from './pages/GrupoConsultado/sabatino/Industrial_grupo_sabatino.jsx'

//Dominical
import Sistemas_grupo_dominical from './pages/GrupoConsultado/dominical/Sistemas_grupo_dominical.jsx'
import Derecho_grupo_dominical from './pages/GrupoConsultado/dominical/Derecho_grupo_dominical.jsx'
import Pedagogia_grupo_dominical from './pages/GrupoConsultado/dominical/Pedagogia_grupo_dominical.jsx'
import Psicologia_grupo_dominical from './pages/GrupoConsultado/dominical/Psicologia_grupo_dominical.jsx'
import Administracion_grupo_dominical from './pages/GrupoConsultado/dominical/Administracion_grupo_dominical.jsx'
import Deporte_grupo_dominical from './pages/GrupoConsultado/dominical/Deporte_grupo_dominical.jsx'
import Contaduria_grupo_dominical from './pages/GrupoConsultado/dominical/Contaduria_grupo_dominical.jsx'
import Criminologia_grupo_dominical from './pages/GrupoConsultado/dominical/Criminologia_grupo_dominical.jsx'
import Trabajo_grupo_dominical from './pages/GrupoConsultado/dominical/Trabajo_grupo_dominical.jsx'
import Industrial_grupo_dominical from './pages/GrupoConsultado/dominical/Industrial_grupo_dominical.jsx'

//Virtual
import Sistemas_grupo_virtual from './pages/GrupoConsultado/virtual/Sistemas_grupo_virtual.jsx'
import Derecho_grupo_virtual from './pages/GrupoConsultado/virtual/Derecho_grupo_virtual.jsx'
import Pedagogia_grupo_virtual from './pages/GrupoConsultado/virtual/Pedagogia_grupo_virtual.jsx'
import Psicologia_grupo_virtual from './pages/GrupoConsultado/virtual/Psicologia_grupo_virtual.jsx'
import Administracion_grupo_virtual from './pages/GrupoConsultado/virtual/Administracion_grupo_virtual.jsx'
import Deporte_grupo_virtual from './pages/GrupoConsultado/virtual/Deporte_grupo_virtual.jsx'
import Contaduria_grupo_virtual from './pages/GrupoConsultado/virtual/Contaduria_grupo_virtual.jsx'
import Criminologia_grupo_virtual from './pages/GrupoConsultado/virtual/Criminologia_grupo_virtual.jsx'
import Trabajo_grupo_virtual from './pages/GrupoConsultado/virtual/Trabajo_grupo_virtual.jsx'
import Industrial_grupo__virtual from './pages/GrupoConsultado/virtual/Industrial_grupo__virtual.jsx'


// * MODIFICAR GRUPOS -----------------------------------------------------------------------------------

//Escolarizado
import Modificar_sistemas from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_sistemas.jsx'
import Modificar_derecho from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_derecho.jsx'
import Modificar_pedagogia from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_pedagogia.jsx'
import Modificar_psicologia from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_psicologia.jsx'
import Modificar_administracion from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_administracion.jsx'
import Modificar_deportes from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_deportes.jsx'
import Modificar_contaduria from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_contaduria.jsx'
import Modificar_criminologia from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_criminologia.jsx'
import Modificar_trabajo_social from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_trabajo_social.jsx'
import Modificar_industrial from './pages/ConsultarUsuarios/Grupos/escolarizado/Modificar_industrial.jsx'

//Sabatino
import Modificar_sistemas_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_sistemas_sabatino.jsx'
import Modificar_derecho_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_derecho_sabatino.jsx'
import Modificar_pedagogia_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_pedagogia_sabatino.jsx'
import Modificar_psicologia_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_psicologia_sabatino.jsx'
import Modificar_administracion_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_administracion_sabatino.jsx'
import Modificar_deportes_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_deportes_sabatino.jsx'
import Modificar_contaduria_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_contaduria_sabatino.jsx'
import Modificar_criminologia_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_criminologia_sabatino.jsx'
import Modificar_trabajo_social_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_trabajo_social_sabatino.jsx'
import Modificar_industrial_sabatino from './pages/ConsultarUsuarios/Grupos/sabatino/Modificar_industrial_sabatino.jsx'

//Dominical
import Modificar_sistemas_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_sistemas_dominical.jsx'
import Modificar_derecho_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_derecho_dominical.jsx'
import Modificar_pedagogia_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_pedagogia_dominical.jsx'
import Modificar_psicologia_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_psicologia_dominical.jsx'
import Modificar_administracion_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_administracion_dominical.jsx'
import Modificar_deportes_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_deportes_dominical.jsx'
import Modificar_contaduria_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_contaduria_dominical.jsx'
import Modificar_criminologia_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_criminologia_dominical.jsx'
import Modificar_trabajo_social_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_trabajo_social_dominical.jsx'
import Modificar_industrial_dominical from './pages/ConsultarUsuarios/Grupos/dominical/Modificar_industrial_dominical.jsx'

//Virtual
import Modificar_sistemas_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_sistemas_virtual.jsx'
import Modificar_derecho_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_derecho_virtual.jsx'
import Modificar_pedagogia_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_pedagogia_virtual.jsx'
import Modificar_psicologia_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_psicologia_virtual.jsx'
import Modificar_administracion_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_administracion_virtual.jsx'
import Modificar_deportes_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_deportes_virtual.jsx'
import Modificar_contaduria_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_contaduria_virtual.jsx'
import Modificar_criminologia_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_criminologia_virtual.jsx'
import Modificar_trabajo_social_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_trabajo_social_virtual.jsx'
import Modificar_industrial_virtual from './pages/ConsultarUsuarios/Grupos/virtual/Modificar_industrial_virtual.jsx'

import CarrerasGrupos from "./pages/carreras/CarrerasGrupos";
import AlumnosPorCarrera from "./pages/Carreras/AlumnosPorCarrera";



/* import Semestre6M from './pages/ConsultarUsuarios/Grupos/Semestre6' */

import ListarCalificaciones from './pages/ConsultarUsuarios/Calificaciones/ListarCalificaciones'
import ModificarInfoAlumno from './pages/ConsultarUsuarios/Calificaciones/ModificarInfoAlumno'
import SubirCalificaciones from './pages/ConsultarUsuarios/Calificaciones/SubirCalificaciones'
import Login from './pages/Login/Login'
import ModificarCalificacion from './pages/ConsultarUsuarios/Calificaciones/ModificarCalificacion'
import PruebaForm from './pages/prueba/PruebaForm'
import GruposPorCarrera from './pages/actualizarinfo/GruposPorCarrera.jsx';
import AlumnosPorGrupo from './pages/actualizarinfo/AlumnosPorGrupo.jsx';

// * COMPLEMENTO: GRUPOS, ALUMNOS POR CARRERA Y PROFESORES ----------------------------------------------
import Grupos from './pages/Grupos/Grupos.jsx';
import CrearGrupo from './pages/Grupos/CrearGrupo.jsx';
import DetalleGrupo from './pages/Grupos/DetalleGrupo.jsx';
import InscribirProfesor from './pages/Grupos/InscribirProfesor.jsx';
import CalificacionesGrupo from './pages/Grupos/CalificacionesGrupo.jsx';
import CalificacionesGrupoMateria from './pages/Grupos/CalificacionesGrupoMateria.jsx';
import ConsultarAsistencia from './pages/Grupos/ConsultarAsistencia.jsx';
import InscribirPsicologo from './pages/Psicologos/InscribirPsicologo.jsx';
import Materias from './pages/Materias/Materias.jsx';

function App() {

  return (
   <Router>
      <Routes>
        {/* <Route path='/' Component={Login}/>  */}
        <Route path='/' Component={Login}/>
        <Route path='/dashboard' Component={Dashboard}/>
        <Route path="/CambiarPassword" Component={CambiarPassword} />
        <Route path="/Candados" Component={Candados} />
        <Route path='/CrearAvisos' Component={CrearAvisos}/>
        <Route path='/InscribirAlumnos' Component={InscribirAlumnos}/>
        <Route path='/ConsultarGrupos' Component={ConsultarGrupos}/>
        <Route path='/ConsultarUsuarios' Component={ConsultarUsuarios}/>
        <Route path='/ConsultarUsuarios/Editar/:rol/:id' Component={EditarUsuario}/>
        <Route path='/HistorialAcademico' Component={ListarAlumnosHistorial}/>
        <Route path='/HistorialAcademico/:id' Component={DetalleHistorialAcademico}/>

        {/* COMPLEMENTO: GRUPOS, ALUMNOS POR CARRERA Y PROFESORES */}
        <Route path='/Grupos' Component={Grupos}/>
        <Route path='/Grupos/Crear' Component={CrearGrupo}/>
        <Route path='/Grupos/Editar/:id_grupo' Component={CrearGrupo}/>
        <Route path='/Grupos/InscribirProfesor' Component={InscribirProfesor}/>
        <Route path='/Grupos/Detalle/:id_grupo/Calificaciones' Component={CalificacionesGrupo}/>
        <Route path='/Grupos/Detalle/:id_grupo/Calificaciones/:materia' Component={CalificacionesGrupoMateria}/>
        <Route path='/Grupos/Detalle/:id_grupo/Asistencia' Component={ConsultarAsistencia}/>
        <Route path='/Grupos/Detalle/:id_grupo' Component={DetalleGrupo}/>
        <Route path='/InscribirPsicologo' Component={InscribirPsicologo}/>
        <Route path='/Materias' Component={Materias}/>

        {/* LISTADO DE GRUPOS POR CARRERA*/}
        <Route path="/carreras" Component={CarrerasGrupos} />
        <Route path="/alumnos/:id" Component={AlumnosPorCarrera}/>




        {/*SELECCIONAR ALUMNOS POR CARRERA PARA MODIFICAR INFO*/}
        <Route
  path="/grupos/:id"
  element={<GruposPorCarrera />}
/>

<Route
  path="/alumnos/carrera/:id_carrera"
  element={<AlumnosPorGrupo />}
/>
        

        {/* ESCOLARIZADO*/}
        <Route path='/GruposSistemas' Component={Sistemas_grupo}/>
        <Route path='/GruposDerecho' Component={Derecho_grupo}/>
        <Route path='/GruposPedagogia' Component={Pedagogia_grupo}/>
        <Route path='/GruposPsicologia' Component={Psicologia_grupo}/>
        <Route path='/GruposAdministracion' Component={Administracion_grupo}/>
        <Route path='/GruposDeporte' Component={Deporte_grupo}/>
        <Route path='/GruposContaduria' Component={Contaduria_grupo}/>
        <Route path='/GruposCriminologia' Component={Criminologia_grupo}/>
        <Route path='/GruposTrabajoSocial' Component={Trabajo_grupo}/>
        <Route path='/GruposIndustrial' Component={Industrial_grupo}/>

        {/* SABATINO*/}
        <Route path='/GruposSistemasSabatino' Component={Sistemas_grupo_sabatino}/>
        <Route path='/GruposDerechoSabatino' Component={Derecho_grupo_sabatino}/>
        <Route path='/GruposPedagogiaSabatino' Component={Pedagogia_grupo_sabatino}/>
        <Route path='/GruposPsicologiaSabatino' Component={Psicologia_grupo_sabatino}/>
        <Route path='/GruposAdministracionSabatino' Component={Administracion_grupo_sabatino}/>
        <Route path='/GruposDeporteSabatino' Component={Deporte_grupo_sabatino}/>
        <Route path='/GruposContaduriaSabatino' Component={Contaduria_grupo_sabatino}/>
        <Route path='/GruposCriminologiaSabatino' Component={Criminologia_grupo_sabatino}/>
        <Route path='/GruposTrabajoSocialSabatino' Component={Trabajo_grupo_sabatino}/>
        <Route path='/GruposIndustrialSabatino' Component={Industrial_grupo_sabatino}/>
        

        {/* DOMINICAL*/}
        <Route path='/GruposSistemasDominical' Component={Sistemas_grupo_dominical}/>
        <Route path='/GruposDerechoDominical' Component={Derecho_grupo_dominical}/>
        <Route path='/GruposPedagogiaDominical' Component={Pedagogia_grupo_dominical}/>
        <Route path='/GruposPsicologiaDominical' Component={Psicologia_grupo_dominical}/>
        <Route path='/GruposAdministracionDominical' Component={Administracion_grupo_dominical}/>
        <Route path='/GruposDeporteDominical' Component={Deporte_grupo_dominical}/>
        <Route path='/GruposContaduriaDominical' Component={Contaduria_grupo_dominical}/>
        <Route path='/GruposCriminologiaDominical' Component={Criminologia_grupo_dominical}/>
        <Route path='/GruposTrabajoSocialDominical' Component={Trabajo_grupo_dominical}/>
        <Route path='/GruposIndustrialDominical' Component={Industrial_grupo_dominical}/>

        {/* VIRTUAL*/}
        <Route path='/GruposSistemasVirtual' Component={Sistemas_grupo_virtual}/>
        <Route path='/GruposDerechoVirtual' Component={Derecho_grupo_virtual}/>
        <Route path='/GruposPedagogiaVirtual' Component={Pedagogia_grupo_virtual}/>
        <Route path='/GruposPsicologiaVirtual' Component={Psicologia_grupo_virtual}/>
        <Route path='/GruposAdministracionVirtual' Component={Administracion_grupo_virtual}/>
        <Route path='/GruposDeporteVirtual' Component={Deporte_grupo_virtual}/>
        <Route path='/GruposContaduriaVirtual' Component={Contaduria_grupo_virtual}/>
        <Route path='/GruposCriminologiaVirtual' Component={Criminologia_grupo_virtual}/>
        <Route path='/GruposTrabajoSocialVirtual' Component={Trabajo_grupo_virtual}/>
        <Route path='/GruposIndustrialVirtual' Component={Industrial_grupo__virtual}/>




        {/* pendiente
        <Route path='/GrupoSemestre6' Component={Semestre6}/> */}


      {/* MODIFICADO DE USUARIOS */}

      {/* ESCOLARIZADO*/}
        <Route path='/ModificarGrupoSistemas' Component={Modificar_sistemas}/>
        <Route path='/ModificarGrupoDerecho' Component={Modificar_derecho}/>
        <Route path='/ModificarGrupoPedagogia' Component={Modificar_pedagogia}/>
        <Route path='/ModificarGrupoPsicologia' Component={Modificar_psicologia}/>
        <Route path='/ModificarGrupoAdministracion' Component={Modificar_administracion}/>
        <Route path='/ModificarGrupoDeportes' Component={Modificar_deportes}/>
        <Route path='/ModificarGrupoContaduria' Component={Modificar_contaduria}/>
        <Route path='/ModificarGrupoCriminologia' Component={Modificar_criminologia}/>
        <Route path='/ModificarGrupoTrabajoSocial' Component={Modificar_trabajo_social}/>
        <Route path='/ModificarGrupoIndustrial' Component={Modificar_industrial}/>


      {/* SABATINO*/}
      <Route path='/ModificarGrupoSistemasSabatino' Component={Modificar_sistemas_sabatino}/>
      <Route path='/ModificarGrupoDerechoSabatino' Component={Modificar_derecho_sabatino}/>
      <Route path='/ModificarGrupoPedagogiaSabatino' Component={Modificar_pedagogia_sabatino}/>
      <Route path='/ModificarGrupoPsicologiaSabatino' Component={Modificar_psicologia_sabatino}/>
      <Route path='/ModificarGrupoAdministracionSabatino' Component={Modificar_administracion_sabatino}/>
      <Route path='/ModificarGrupoDeportesSabatino' Component={Modificar_deportes_sabatino}/>
      <Route path='/ModificarGrupoContaduriaSabatino' Component={Modificar_contaduria_sabatino}/>
      <Route path='/ModificarGrupoCriminologiaSabatino' Component={Modificar_criminologia_sabatino}/>
      <Route path='/ModificarGrupoTrabajoSocialSabatino' Component={Modificar_trabajo_social_sabatino}/>
      <Route path='/ModificarGrupoIndustrialSabatino' Component={Modificar_industrial_sabatino}/>


      {/* DOMINICAL*/}
      <Route path='/ModificarGrupoSistemasDominical' Component={Modificar_sistemas_dominical}/>
      <Route path='/ModificarGrupoDerechoDominical' Component={Modificar_derecho_dominical}/>
      <Route path='/ModificarGrupoPedagogiaDominical' Component={Modificar_pedagogia_dominical}/>
      <Route path='/ModificarGrupoPsicologiaDominical' Component={Modificar_psicologia_dominical}/>
      <Route path='/ModificarGrupoAdministracionDominical' Component={Modificar_administracion_dominical}/>
      <Route path='/ModificarGrupoDeportesDominical' Component={Modificar_deportes_dominical}/>
      <Route path='/ModificarGrupoContaduriaDominical' Component={Modificar_contaduria_dominical}/>
      <Route path='/ModificarGrupoCriminologiaDominical' Component={Modificar_criminologia_dominical}/>
      <Route path='/ModificarGrupoTrabajoSocialDominical' Component={Modificar_trabajo_social_dominical}/>
      <Route path='/ModificarGrupoIndustrialDominical' Component={Modificar_industrial_dominical}/>
      

      {/* VIRTUAL*/}
      <Route path='/ModificarGrupoSistemasVirtual' Component={Modificar_sistemas_virtual}/>
      <Route path='/ModificarGrupoDerechoVirtual' Component={Modificar_derecho_virtual}/>
      <Route path='/ModificarGrupoPedagogiaVirtual' Component={Modificar_pedagogia_virtual}/>
      <Route path='/ModificarGrupoPsicologiaVirtual' Component={Modificar_psicologia_virtual}/>
      <Route path='/ModificarGrupoAdministracionVirtual' Component={Modificar_administracion_virtual}/>
      <Route path='/ModificarGrupoDeportesVirtual' Component={Modificar_deportes_virtual}/>
      <Route path='/ModificarGrupoContaduriaVirtual' Component={Modificar_contaduria_virtual}/>
      <Route path='/ModificarGrupoCriminologiaVirtual' Component={Modificar_criminologia_virtual}/>
      <Route path='/ModificarGrupoTrabajoSocialVirtual' Component={Modificar_trabajo_social_virtual}/>
      <Route path='/ModificarGrupoIndustrialVirtual' Component={Modificar_industrial_virtual}/>
           


        
        {/* <Route path='/ModificarGrupoSemestre6' Component={Semestre6M}/> */}

        <Route path='/ListarCalisAlumno/:id' Component={ListarCalificaciones}/>
        <Route
  path="/ModificarInfoAlumno/:id"
  element={<ModificarInfoAlumno />}
/>
        <Route path='/SubirCalificacionesAlumno/:id' Component={SubirCalificaciones}/>
        <Route path='/ModificarCalificacion/:id' Component={ModificarCalificacion}/>
        <Route path='/Form' Component={PruebaForm}/>



      </Routes>
    </Router>
  );
}

export default App;
