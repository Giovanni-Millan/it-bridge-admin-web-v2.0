import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import Swal from 'sweetalert2';
import { supabase } from '../../../components/supabaseClient.js'; // Ajusta la ruta según tu proyecto

export default function SubirCalificaciones() {
  const navigate = useNavigate();
  const { id } = useParams(); // id del alumno

  const [carrera, setCarrera] = useState("");
  const [id_materia, setId_materia] = useState("");
  const [calificacion_final, setCalificacionFinal] = useState("");
  // Carreras disponibles
  const carreras = [
    { codigo: "SIS", nombre: "Ingeniería en Sistemas" },
    { codigo: "DER", nombre: "Derecho" },
    { codigo: "PED", nombre: "Pedagogía" },
    { codigo: "PSI", nombre: "Psicología" },
    { codigo: "ADM", nombre: "Administración" },
    { codigo: "DEP", nombre: "Ciencias del deporte" },
    { codigo: "CON", nombre: "Contaduria" },
    { codigo: "CRI", nombre: "Criminologia" },
    { codigo: "ING", nombre: "Ingeniería Industrial" },
    { codigo: "TSO", nombre: "Trabajo Social" },
  ];
  
  // Materias por carrera (solo se incluye un fragmento representativo, tú mantén tu lista completa)
   const materias = [
  
      // Ingeniería en Sistemas{
      { codigo: "SIS-01", nombre: "Fundamentos de la Administración" },
      { codigo: "SIS-02", nombre: "Conceptos Jurídicos Fundamentales" },
      { codigo: "SIS-03", nombre: "Macroeconomía" },
      { codigo: "SIS-04", nombre: "Contabilidad Básica" },
      { codigo: "SIS-05", nombre: "Matemáticas Aplicadas" },
      { codigo: "SIS-06", nombre: "Fundamentos de la Mercadotecnia" },
      { codigo: "SIS-07", nombre: "Derecho Fiscal" },
      { codigo: "SIS-08", nombre: "Microeconomía" },
      { codigo: "SIS-09", nombre: "Administración Financiera" },
      { codigo: "SIS-10", nombre: "Estadística" },
      { codigo: "SIS-11", nombre: "Mercadotecnia Estratégica" },
      { codigo: "SIS-12", nombre: "Comportamiento Humano en las Organizaciones" },
      { codigo: "SIS-13", nombre: "Análisis del Entorno Económico, Político y Social" },
      { codigo: "SIS-14", nombre: "Administración del Capital Humano" },
      { codigo: "SIS-15", nombre: "Informática Aplicada" },
      { codigo: "SIS-16", nombre: "Cinemática y Dinámica" },
      { codigo: "SIS-17", nombre: "Fundamentos de Programación" },
      { codigo: "SIS-18", nombre: "Algoritmos y Estructura de Datos" },
      { codigo: "SIS-19", nombre: "Álgebra" },
      { codigo: "SIS-20", nombre: "Estructura de Datos" },
      { codigo: "SIS-21", nombre: "Legislación Informática" },
      { codigo: "SIS-22", nombre: "Programación I" },
      { codigo: "SIS-23", nombre: "Sistemas Operativos" },
      { codigo: "SIS-24", nombre: "Cálculo Diferencial e Integral" },
      { codigo: "SIS-25", nombre: "Base de Datos I" },
      { codigo: "SIS-26", nombre: "Programación Lógica" },
      { codigo: "SIS-27", nombre: "Programación II" },
      { codigo: "SIS-28", nombre: "Estructura y Programación de Computadoras" },
      { codigo: "SIS-29", nombre: "Arquitectura de Computadoras" },
      { codigo: "SIS-30", nombre: "Base de Datos II" },
      { codigo: "SIS-31", nombre: "Consultoría en Tecnologías de la Información" },
      { codigo: "SIS-32", nombre: "Análisis y Diseño de Sistemas de Información I" },
      { codigo: "SIS-33", nombre: "Desarrollo de Aplicaciones Multimedia" },
      { codigo: "SIS-34", nombre: "Redes de Cómputo I" },
      { codigo: "SIS-35", nombre: "Investigación de Operaciones I" },
      { codigo: "SIS-36", nombre: "Ingeniería de Software" },
      { codigo: "SIS-37", nombre: "Análisis y Diseño de Sistemas de Información II" },
      { codigo: "SIS-38", nombre: "Desarrollo de Aplicaciones Web" },
      { codigo: "SIS-39", nombre: "Redes de Cómputo II" },
      { codigo: "SIS-40", nombre: "Investigación de Operaciones II" },
      { codigo: "SIS-41", nombre: "Auditoría y Sistemas de Gestión de Información" },
      { codigo: "SIS-42", nombre: "Inteligencia Artificial" },
      { codigo: "SIS-43", nombre: "Evaluación y Configuración de Hardware" },
      { codigo: "SIS-44", nombre: "Nuevas Tecnologías de Cómputo" },
      { codigo: "SIS-45", nombre: "Seminario de Tesis" },
      { codigo: "SIS-46", nombre: "Mecánica I" },
      { codigo: "SIS-47", nombre: "Gestión Directiva En Instituciones" },
      { codigo: "SIS-48", nombre: "Administración De Compras" },
      { codigo: "SIS-49", nombre: "Geometría Analítica" },
      { codigo: "SIS-50", nombre: "Programación Orientada A Objetos II" },
      { codigo: "SIS-51", nombre: "Base De Datos SQL" },
      { codigo: "SIS-52", nombre: "Inglés" },
      { codigo: "SIS-53", nombre: "Orientacion Profesional" },
      { codigo: "SIS-54", nombre: "Leoye" },
      { codigo: "SIS-55", nombre: "Computación I" },
      { codigo: "SIS-56", nombre: "Desarrollo Organizacional" },
      
      // Derecho
      { codigo: "DER-01", nombre: "Introducción al Derecho" },
      { codigo: "DER-02", nombre: "Derecho Romano" },
      { codigo: "DER-03", nombre: "Teoría del Estado" },
      { codigo: "DER-04", nombre: "Comunicación Escrita" },
      { codigo: "DER-05", nombre: "Sociología Jurídica" },
      { codigo: "DER-06", nombre: "Metodología Jurídica" },
      { codigo: "DER-07", nombre: "Historia del Derecho en México" },
      { codigo: "DER-08", nombre: "Derecho Civil I" },
      { codigo: "DER-09", nombre: "Derecho Penal I" },
      { codigo: "DER-10", nombre: "Teoría Económica" },
      { codigo: "DER-11", nombre: "Informática" },
      { codigo: "DER-12", nombre: "Comunicación Oral" },
      { codigo: "DER-13", nombre: "Derecho Civil II" },
      { codigo: "DER-14", nombre: "Derecho Penal II" },
      { codigo: "DER-15", nombre: "Ciencia Política" },
      { codigo: "DER-16", nombre: "Derechos Humanos" },
      { codigo: "DER-17", nombre: "Derecho Económico" },
      { codigo: "DER-18", nombre: "Interpretación y Argumentación Jurídica" },
      { codigo: "DER-19", nombre: "Derecho Institucional I" },
      { codigo: "DER-20", nombre: "Garantías Individuales y Sociales" },
      { codigo: "DER-21", nombre: "Derecho Mercantil I" },
      { codigo: "DER-22", nombre: "Teoría General del Proceso" },
      { codigo: "DER-23", nombre: "Derecho Civil IV" },
      { codigo: "DER-24", nombre: "Derecho Procesal Penal" },
      { codigo: "DER-25", nombre: "Derecho Constitucional II" },
      { codigo: "DER-26", nombre: "Derecho Administrativo I" },
      { codigo: "DER-27", nombre: "Derecho Mercantil II" },
      { codigo: "DER-28", nombre: "Filosofía del Derecho" },
      { codigo: "DER-29", nombre: "Derecho Procesal Civil" },
      { codigo: "DER-30", nombre: "Seguros y Finanzas" },
      { codigo: "DER-31", nombre: "Derecho Administrativo II" },
      { codigo: "DER-32", nombre: "Derecho de la Seguridad Social" },
      { codigo: "DER-33", nombre: "Derecho Individual del Trabajo" },
      { codigo: "DER-34", nombre: "Derecho Procesal Mercantil" },
      { codigo: "DER-35", nombre: "Derecho de Amparo I" },
      { codigo: "DER-36", nombre: "Derecho Agrario" },
      { codigo: "DER-37", nombre: "Derecho Notarial y Registral" },
      { codigo: "DER-38", nombre: "Derecho Internacional Público" },
      { codigo: "DER-39", nombre: "Derecho Colectivo del Trabajo" },
      { codigo: "DER-40", nombre: "Derecho Fiscal I" },
      { codigo: "DER-41", nombre: "Derecho de Amparo II" },
      { codigo: "DER-42", nombre: "Informática Jurídica" },
      { codigo: "DER-43", nombre: "Juicios Orales" },
      { codigo: "DER-44", nombre: "Derecho Internacional Privado" },
      { codigo: "DER-45", nombre: "Derecho Municipal" },
      { codigo: "DER-46", nombre: "Derecho Fiscal II" },
      { codigo: "DER-47", nombre: "Derecho Aduanero" },
      { codigo: "DER-48", nombre: "Deontología Jurídica" },
      { codigo: "DER-49", nombre: "Medicina Forense" },
      { codigo: "DER-50", nombre: "Medios Alternos de Solución de Conflictos" },
      { codigo: "DER-51", nombre: "Derecho Bancario y Bursátil" },
      { codigo: "DER-52", nombre: "Seminario de Investigación" },
      { codigo: "DER-53", nombre: "Derecho Colectivo del Trabajo" },
{ codigo: "DER-54", nombre: "Derecho Agrario" },
{ codigo: "DER-55", nombre: "Amparo" },
{ codigo: "DER-56", nombre: "Juicios Orales Penales" },
{ codigo: "DER-57", nombre: "Derecho a la Transparencia y Acceso a la Información" },
{ codigo: "DER-58", nombre: "Derecho Procesal Civil" },
{ codigo: "DER-59", nombre: "Derecho Constitucional Jurídico" },
{ codigo: "DER-60", nombre: "Derecho Laboral" },
  
      // Pedagogía
      { codigo: "PED-01", nombre: "Metodología de la Investigación I" },
      { codigo: "PED-02", nombre: "Introducción a la Psicología" },
      { codigo: "PED-03", nombre: "Antropología Filosófica" },
      { codigo: "PED-04", nombre: "Historia General de la Educación I" },
      { codigo: "PED-05", nombre: "Teoría Pedagógica I" },
      { codigo: "PED-06", nombre: "Métodos de Estudio" },
      { codigo: "PED-07", nombre: "Metodología de la Investigación II" },
      { codigo: "PED-08", nombre: "Psicología del Aprendizaje" },
      { codigo: "PED-09", nombre: "Sociología de la Educación" },
      { codigo: "PED-10", nombre: "Historia General de la Educación II" },
      { codigo: "PED-11", nombre: "Teoría Pedagógica II" },
      { codigo: "PED-12", nombre: "Pensamiento y Lenguaje" },
      { codigo: "PED-13", nombre: "Estadística I" },
      { codigo: "PED-14", nombre: "Conocimiento de la Infancia" },
      { codigo: "PED-15", nombre: "Epistemología" },
      { codigo: "PED-16", nombre: "Historia de la Educación en México I" },
      { codigo: "PED-17", nombre: "Introducción a la Didáctica" },
      { codigo: "PED-18", nombre: "Filosofía de la Educación" },
      { codigo: "PED-19", nombre: "Estadística II" },
      { codigo: "PED-20", nombre: "Didáctica" },
      { codigo: "PED-21", nombre: "Conocimiento de la Adolescencia" },
      { codigo: "PED-22", nombre: "Historia de la Educación en México II" },
      { codigo: "PED-23", nombre: "Auxiliares de la Comunicación" },
      { codigo: "PED-24", nombre: "Planeación Educativa" },
      { codigo: "PED-25", nombre: "Conocimiento del Adulto" },
      { codigo: "PED-26", nombre: "Política y Legislación Educativa en México I" },
      { codigo: "PED-27", nombre: "Psicología Social" },
      { codigo: "PED-28", nombre: "Dinámicas de Grupo" },
      { codigo: "PED-29", nombre: "Administración Educativa" },
      { codigo: "PED-30", nombre: "Diseño Curricular" },
      { codigo: "PED-31", nombre: "Psicopatología del Escolar" },
      { codigo: "PED-32", nombre: "Política y Legislación Educativa en México II" },
      { codigo: "PED-33", nombre: "Producción de Apoyos Didácticos" },
      { codigo: "PED-34", nombre: "Evaluación Curricular" },
      { codigo: "PED-35", nombre: "Educación y Diversidad Cultural" },
      { codigo: "PED-36", nombre: "Desarrollo Organizacional" },
      { codigo: "PED-37", nombre: "Seminario de Investigación I" },
      { codigo: "PED-38", nombre: "Psicotécnia Pedagógica" },
      { codigo: "PED-39", nombre: "Desarrollo de Entornos Visuales de Aprendizaje" },
      { codigo: "PED-40", nombre: "Educación en América Latina" },
      { codigo: "PED-41", nombre: "Orientación Educativa y Vocacional I" },
      { codigo: "PED-42", nombre: "Desarrollo de Habilidades Docentes" },
      { codigo: "PED-43", nombre: "Seminario de Investigación II" },
      { codigo: "PED-44", nombre: "Capacitación Empresarial" },
      { codigo: "PED-45", nombre: "Desarrollo Comunitario I" },
      { codigo: "PED-46", nombre: "Orientación Educativa y Vocacional II" },
      { codigo: "PED-47", nombre: "Pedagogía Comparada" },
      { codigo: "PED-48", nombre: "Ética Profesional" },
      { codigo: "PED-49", nombre: "Educación Especial" },
      { codigo: "PED-50", nombre: "Desarrollo Comunitario II" },
      { codigo: "PED-51", nombre: "Pedagogía Contemporánea" },
      { codigo: "PED-52", nombre: "Gestión Directiva en Instituciones Educativas" },
      { codigo: "PED-53", nombre: "Sociología Organizacional" },
      { codigo: "PED-54", nombre: "Etica Profesional" },
      { codigo: "PED-55", nombre: "Computacion" },
      { codigo: "PED-56", nombre: "Ingles" },
      { codigo: "PED-57", nombre: "Introducción A La Pedagogia" },
      
      // Psicología
      { codigo: "PSI-01", nombre: "Bases Biológicas de la Conducta" },
      { codigo: "PSI-02", nombre: "Historia de la Psicología" },
      { codigo: "PSI-03", nombre: "Modelos en Psicología Clínica" },
      { codigo: "PSI-04", nombre: "Sociología" },
      { codigo: "PSI-05", nombre: "Taller de Lectura y Redacción" },
      { codigo: "PSI-06", nombre: "Inglés I" },
      { codigo: "PSI-07", nombre: "Neurobiología y Adaptación" },
      { codigo: "PSI-08", nombre: "Trastornos Mentales" },
      { codigo: "PSI-09", nombre: "Aprendizaje y Conducta Adaptativa I" },
      { codigo: "PSI-10", nombre: "Psicología Psicogenética Constructivista" },
      { codigo: "PSI-11", nombre: "Metodología de la Investigación" },
      { codigo: "PSI-12", nombre: "Inglés II" },
      { codigo: "PSI-13", nombre: "Psicofisiología" },
      { codigo: "PSI-14", nombre: "Método Clínico" },
      { codigo: "PSI-15", nombre: "Ciclo de la Vida" },
      { codigo: "PSI-16", nombre: "Aprendizaje y Conducta Adaptativa II" },
      { codigo: "PSI-17", nombre: "Psicología Social" },
      { codigo: "PSI-18", nombre: "Inglés III" },
      { codigo: "PSI-19", nombre: "Neurocognición" },
      { codigo: "PSI-20", nombre: "Medición y Evaluación" },
      { codigo: "PSI-21", nombre: "Teoría Sociocultural" },
      { codigo: "PSI-22", nombre: "Aprendizaje y Conducta Adaptativa III" },
      { codigo: "PSI-23", nombre: "Administración de Empresas" },
      { codigo: "PSI-24", nombre: "Inglés IV" },
      { codigo: "PSI-25", nombre: "Psicodiagnóstico I" },
      { codigo: "PSI-26", nombre: "Entrevista I" },
      { codigo: "PSI-27", nombre: "Paradigmas Psicológicos en Educación" },
      { codigo: "PSI-28", nombre: "Procesos Psicoeducativos" },
      { codigo: "PSI-29", nombre: "Capacitación y Desarrollo de Personal I" },
      { codigo: "PSI-30", nombre: "Administración de Personal" },
      { codigo: "PSI-31", nombre: "Entrevista II" },
      { codigo: "PSI-32", nombre: "Paradigmas Psicoeducativos" },
      { codigo: "PSI-33", nombre: "Integración Educativa" },
      { codigo: "PSI-34", nombre: "Capacitación y Desarrollo de Personal II" },
      { codigo: "PSI-35", nombre: "Integración de Personal I" },
      { codigo: "PSI-36", nombre: "Integración de Informes Psicológicos" },
      { codigo: "PSI-37", nombre: "Psicopatología y Personalidad" },
      { codigo: "PSI-38", nombre: "Evaluación Educativa" },
      { codigo: "PSI-39", nombre: "Sistema Educativo Mexicano" },
      { codigo: "PSI-40", nombre: "Relaciones Laborales" },
      { codigo: "PSI-41", nombre: "Integración de Personal II" },
      { codigo: "PSI-42", nombre: "Psicopatología del Desarrollo Infantil" },
      { codigo: "PSI-43", nombre: "Sistemas Terapéuticos" },
      { codigo: "PSI-44", nombre: "Programas de Intervención Psicoeducativa" },
      { codigo: "PSI-45", nombre: "Cultura y Comportamiento Organizacional" },
      { codigo: "PSI-46", nombre: "Elaboración de Pruebas Industriales" },
      { codigo: "PSI-47", nombre: "Ética Profesional" },
      { codigo: "PSI-48", nombre: "Intervención en Niños" },
      { codigo: "PSI-49", nombre: "Alternativas Terapéuticas en Niños y Adolescentes" },
      { codigo: "PSI-50", nombre: "Calidad y Productividad" },
      { codigo: "PSI-51", nombre: "Equipos de Trabajo" },
      { codigo: "PSI-52", nombre: "Seminario de Investigación" },
      { codigo: "PSI-53", nombre: "Neuropsicología" },
      { codigo: "PSI-54", nombre: "Psicopatologia ll" },
      { codigo: "PSI-55", nombre: "Psicofisiologia II" },
      { codigo: "PSI-56", nombre: "Organización De Proyectos Y Grupos De Trabajo" },
      { codigo: "PSI-57", nombre: "Sociología  Organizacional" },
      { codigo: "PSI-58", nombre: "Psicologia Laboral Aplicada" },
      { codigo: "PSI-59", nombre: "ANABEL" },
      { codigo: "PSI-60", nombre: "Computación" },
      { codigo: "PSI-61", nombre: "Introduccion A La Psicologia" },
      { codigo: "PSI-62", nombre: "Fundamentos del Psicoanálisis" },
{ codigo: "PSI-63", nombre: "Bioética y Normatividad" },
      
      // Administración
      { codigo: "ADM-01", nombre: "Metodología de la Investigación" },
      { codigo: "ADM-02", nombre: "Redacción Avanzada" },
      { codigo: "ADM-03", nombre: "Matemáticas Aplicadas a los Negocios I" },
      { codigo: "ADM-04", nombre: "Visión Microeconómica" },
      { codigo: "ADM-05", nombre: "Informática Aplicada a los Negocios I" },
      { codigo: "ADM-06", nombre: "Derecho Constitucional y Administrativo" },
      { codigo: "ADM-07", nombre: "Administración I" },
      { codigo: "ADM-08", nombre: "Teoría de la Comunicación" },
      { codigo: "ADM-09", nombre: "Matemáticas Aplicadas a los Negocios II" },
      { codigo: "ADM-10", nombre: "Visión Macroeconómica" },
      { codigo: "ADM-11", nombre: "Informática Aplicada a los Negocios II" },
      { codigo: "ADM-12", nombre: "Derecho Mercantil" },
      { codigo: "ADM-13", nombre: "Administración II" },
      { codigo: "ADM-14", nombre: "Sociología de las Organizaciones" },
      { codigo: "ADM-15", nombre: "Estadística para los Negocios" },
      { codigo: "ADM-16", nombre: "Mercadotecnia" },
      { codigo: "ADM-17", nombre: "Informática Aplicada a los Negocios III" },
      { codigo: "ADM-18", nombre: "Información Financiera" },
      { codigo: "ADM-19", nombre: "Administración de Personal" },
      { codigo: "ADM-20", nombre: "Administración de la Producción" },
      { codigo: "ADM-21", nombre: "Investigación de Operaciones" },
      { codigo: "ADM-22", nombre: "Sistemas y Procedimientos" },
      { codigo: "ADM-23", nombre: "Comportamiento Organizacional" },
      { codigo: "ADM-24", nombre: "Derecho Civil" },
      { codigo: "ADM-25", nombre: "Calidad Total" },
      { codigo: "ADM-26", nombre: "Administración de Compras" },
      { codigo: "ADM-27", nombre: "Costos I" },
      { codigo: "ADM-28", nombre: "Sistemas Administrativos" },
      { codigo: "ADM-29", nombre: "Derecho Laboral" },
      { codigo: "ADM-30", nombre: "Contabilidad Administrativa" },
      { codigo: "ADM-31", nombre: "Finanzas I" },
      { codigo: "ADM-32", nombre: "Costos II" },
      { codigo: "ADM-33", nombre: "Presupuestos" },
      { codigo: "ADM-34", nombre: "Administración de la Mercadotecnia" },
      { codigo: "ADM-35", nombre: "Liderazgo" },
      { codigo: "ADM-36", nombre: "Finanzas II" },
      { codigo: "ADM-37", nombre: "Administración de Proyectos" },
      { codigo: "ADM-38", nombre: "Estudio Contable de los Impuestos I" },
      { codigo: "ADM-39", nombre: "Derecho Fiscal" },
      { codigo: "ADM-40", nombre: "Auditoría Administrativa" },
      { codigo: "ADM-41", nombre: "Trabajo en Equipo y Negociación" },
      { codigo: "ADM-42", nombre: "Habilidades Directivas" },
      { codigo: "ADM-43", nombre: "Análisis Financiero" },
      { codigo: "ADM-44", nombre: "Relaciones Públicas" },
      { codigo: "ADM-45", nombre: "Gestión Directiva En Instituciones" },
      { codigo: "ADM-46", nombre: "Ética Profesional" },
      { codigo: "ADM-47", nombre: "Computación" },
      { codigo: "ADM-48", nombre: "Comercio Internacional" },
      { codigo: "ADM-49", nombre: "Recursos Humanosl" },
      { codigo: "ADM-50", nombre: "Trabajo En Equipo" },
      { codigo: "ADM-51", nombre: "Micro-Macro Economia" },
  
      // Ciencias del deporte
      { codigo: "DEP-01", nombre: "Anatomía funcional" },
      { codigo: "DEP-02", nombre: "Fundamentos del deporte" },
      { codigo: "DEP-03", nombre: "Psicología deportiva" },
      { codigo: "DEP-04", nombre: "Bases de la administración" },
      { codigo: "DEP-05", nombre: "Introducción a la educación física" },
      { codigo: "DEP-06", nombre: "Actividad física I" },
      { codigo: "DEP-07", nombre: "Fisiología del ejercicio" },
      { codigo: "DEP-08", nombre: "Teoría del entrenamiento" },
      { codigo: "DEP-09", nombre: "Nutrición deportiva" },
      { codigo: "DEP-10", nombre: "Administración deportiva" },
      { codigo: "DEP-11", nombre: "Actividad física II" },
      { codigo: "DEP-12", nombre: "Biomecánica" },
      { codigo: "DEP-13", nombre: "Evaluación del rendimiento físico" },
      { codigo: "DEP-14", nombre: "Planificación del entrenamiento" },
      { codigo: "DEP-15", nombre: "Legislación deportiva" },
      { codigo: "DEP-16", nombre: "Actividad física III" },
      { codigo: "DEP-17", nombre: "Métodos de entrenamiento" },
      { codigo: "DEP-18", nombre: "Organización de eventos deportivos" },
      { codigo: "DEP-19", nombre: "Gestión de instalaciones deportivas" },
      { codigo: "DEP-20", nombre: "Marketing deportivo" },
      { codigo: "DEP-21", nombre: "Actividad física IV" },
      { codigo: "DEP-22", nombre: "Deporte adaptado" },
      { codigo: "DEP-23", nombre: "Actividad física en poblaciones especiales" },
      { codigo: "DEP-24", nombre: "Dirección técnica" },
      { codigo: "DEP-25", nombre: "Estadística aplicada al deporte" },
      { codigo: "DEP-26", nombre: "Actividad física y salud" },
      { codigo: "DEP-27", nombre: "Gestión de proyectos deportivos" },
      { codigo: "DEP-28", nombre: "Comunicación deportiva" },
      { codigo: "DEP-29", nombre: "Investigación en ciencias del deporte" },
      { codigo: "DEP-30", nombre: "Seminario de tesis I" },
      { codigo: "DEP-31", nombre: "Entrenamiento en deportes de conjunto" },
      { codigo: "DEP-32", nombre: "Administración estratégica en deporte" },
      { codigo: "DEP-33", nombre: "Seminario de tesis II" },
      { codigo: "DEP-34", nombre: "Entrenamiento en deportes individuales" },
      { codigo: "DEP-35", nombre: "Ética y valores en el deporte" },
      { codigo: "DEP-36", nombre: "Prácticas profesionales" },
      { codigo: "DEP-37", nombre: "Desarrollo de proyectos deportivos" },
      { codigo: "DEP-38", nombre: "Evaluación de programas de actividad física" },
      
      // Contaduria
      { codigo: "CON-01", nombre: "Metodología de la Investigación" },
      { codigo: "CON-02", nombre: "Redacción Avanzada" },
      { codigo: "CON-03", nombre: "Matemáticas Aplicadas a los Negocios II" },
      { codigo: "CON-04", nombre: "Visión Microeconómica" },
      { codigo: "CON-05", nombre: "Informática Aplicada a los Negocios I" },
      { codigo: "CON-06", nombre: "Derecho Constitucional y Administrativo" },
      { codigo: "CON-07", nombre: "Administración I" },
      { codigo: "CON-08", nombre: "Teoría de la Comunicación" },
      { codigo: "CON-10", nombre: "Visión Macroeconómica" },
      { codigo: "CON-11", nombre: "Informática Aplicada a los Negocios II" },
      { codigo: "CON-12", nombre: "Derecho Mercantil" },
      { codigo: "CON-13", nombre: "Administración II" },
      { codigo: "CON-14", nombre: "Sociología de las Organizaciones" },
      { codigo: "CON-15", nombre: "Estadística para los Negocios" },
      { codigo: "CON-16", nombre: "Mercadotecnia" },
      { codigo: "CON-17", nombre: "Informática Aplicada a los Negocios III" },
      { codigo: "CON-18", nombre: "Información Financiera" },
      { codigo: "CON-19", nombre: "Administración de Personal" },
      { codigo: "CON-20", nombre: "Administración de la Producción" },
      { codigo: "CON-21", nombre: "Investigación de Operaciones" },
      { codigo: "CON-22", nombre: "Sistemas y Procedimientos" },
      { codigo: "CON-23", nombre: "Comportamiento Organizacional" },
      { codigo: "CON-24", nombre: "Derecho Civil" },
      { codigo: "CON-25", nombre: "Calidad Total" },
      { codigo: "CON-26", nombre: "Administración de Compras" },
      { codigo: "CON-27", nombre: "Costos I" },
      { codigo: "CON-28", nombre: "Sistemas Administrativos" },
      { codigo: "CON-29", nombre: "Derecho Laboral" },
      { codigo: "CON-30", nombre: "Contabilidad Administrativa" },
      { codigo: "CON-31", nombre: "Finanzas I" },
      { codigo: "CON-32", nombre: "Costos II" },
      { codigo: "CON-33", nombre: "Presupuestos" },
      { codigo: "CON-34", nombre: "Administración de la Mercadotecnia" },
      { codigo: "CON-35", nombre: "Liderazgo" },
      { codigo: "CON-36", nombre: "Finanzas II" },
      { codigo: "CON-37", nombre: "Administración de Proyectos" },
      { codigo: "CON-38", nombre: "Estudio Contable de los Impuestos I" },
      { codigo: "CON-39", nombre: "Derecho Fiscal" },
        { codigo: "CON-40", nombre: "Auditoría Administrativa" },
        { codigo: "CON-41", nombre: "Trabajo en Equipo y Negociación" },
        { codigo: "CON-42", nombre: "Habilidades Directivas" },
        { codigo: "CON-43", nombre: "Análisis Financiero" },
        { codigo: "CON-44", nombre: "Relaciones Públicas" },
        { codigo: "CON-45", nombre: "Comercio Internacional" },
{ codigo: "CON-46", nombre: "Derecho Constitucional" },
{ codigo: "CON-47", nombre: "Contabilidad Avanzada" },
{ codigo: "CON-48", nombre: "Recursos Humanos" },
{ codigo: "CON-49", nombre: "Economía" },
{ codigo: "CON-50", nombre: "Trabajo en Equipo" },
{ codigo: "CON-51", nombre: "Micro-Macro Economía" },
  
      // Criminologia
      { codigo: "CRI-01", nombre: "Bases Generales del Derecho" },
      { codigo: "CRI-02", nombre: "Fundamentos Básicos del Derecho Penal" },
      { codigo: "CRI-03", nombre: "Sociología Criminal" },
      { codigo: "CRI-04", nombre: "Perspectiva Psicológica y Criminológica" },
      { codigo: "CRI-05", nombre: "Anatomía y Fisiología Humana I" },
      { codigo: "CRI-06", nombre: "Investigación Criminal" },
      { codigo: "CRI-07", nombre: "Teoría del Delito y de las Penas Aritméticas" },
      { codigo: "CRI-08", nombre: "Criminología I" },
      { codigo: "CRI-09", nombre: "Psicología Criminal" },
      { codigo: "CRI-10", nombre: "Anatomía y Fisiología Humana II" },
      { codigo: "CRI-11", nombre: "Introducción a la Criminalística" },
      { codigo: "CRI-12", nombre: "Política Criminal" },
      { codigo: "CRI-13", nombre: "Delitos en Particular" },
      { codigo: "CRI-14", nombre: "Criminología II" },
      { codigo: "CRI-15", nombre: "Criminalística de Campo" },
      { codigo: "CRI-16", nombre: "Estadística Criminal" },
      { codigo: "CRI-17", nombre: "Psiquiatría Criminal" },
      { codigo: "CRI-18", nombre: "Bases Biotipológicas de la Conducta Criminal" },
      { codigo: "CRI-19", nombre: "Delitos Especiales" },
      { codigo: "CRI-20", nombre: "Criminalística de Laboratorio" },
      { codigo: "CRI-21", nombre: "Medicina Básica Legal" },
      { codigo: "CRI-22", nombre: "Dactiloscopía Forense" },
      { codigo: "CRI-23", nombre: "Antropología Criminal" },
      { codigo: "CRI-24", nombre: "Prevención del Delito" },
      { codigo: "CRI-25", nombre: "Juicio Oral Penal" },
      { codigo: "CRI-26", nombre: "Sistemas de Identificación Forense" },
      { codigo: "CRI-27", nombre: "Organización Policial" },
      { codigo: "CRI-28", nombre: "Seguridad Pública" },
      { codigo: "CRI-29", nombre: "Logística y Tácticas Periciales" },
      { codigo: "CRI-30", nombre: "Biología Criminal" },
      { codigo: "CRI-31", nombre: "Derecho Ejecutivo Penal" },
      { codigo: "CRI-32", nombre: "Hematología y Serología Forense" },
      { codigo: "CRI-33", nombre: "Fotografía Forense" },
      { codigo: "CRI-34", nombre: "Física Forense" },
      { codigo: "CRI-35", nombre: "Química Forense" },
      { codigo: "CRI-36", nombre: "Toxicología Forense" },
      { codigo: "CRI-37", nombre: "Sistemas Penitenciarios" },
      { codigo: "CRI-38", nombre: "Inglés I" },
      { codigo: "CRI-39", nombre: "Incendios y Explosiones" },
      { codigo: "CRI-40", nombre: "Hechos de Tránsito Terrestre" },
      { codigo: "CRI-41", nombre: "Balística Forense" },
      { codigo: "CRI-42", nombre: "Criminología Clínica" },
      { codigo: "CRI-43", nombre: "Cálculos, Bases y Medidas Aritméticas" },
      { codigo: "CRI-44", nombre: "Inglés II" },
      { codigo: "CRI-45", nombre: "Poligrafía Forense" },
      { codigo: "CRI-46", nombre: "Grafoscopía y Documentoscopía Forense" },
      { codigo: "CRI-47", nombre: "Criminalidad Femenina" },
      { codigo: "CRI-48", nombre: "Odontología Criminal" },
      { codigo: "CRI-49", nombre: "Inglés III" },
      { codigo: "CRI-50", nombre: "Delincuencia Organizada y Juvenil" },
      { codigo: "CRI-51", nombre: "Peritaje y Dictamen Criminalístico" },
      { codigo: "CRI-52", nombre: "Problemas Criminológicos y Actuales en México" },
      { codigo: "CRI-53", nombre: "Deontología Pericial" },
      { codigo: "CRI-54", nombre: "Seminario de Investigación" },
      { codigo: "CRI-55", nombre: "Inglés IV" },
      { codigo: "CRI-56", nombre: "Peritaje Criminológico" },
{ codigo: "CRI-57", nombre: "Levantamiento y Embalaje de Indicios" },
{ codigo: "CRI-58", nombre: "Criminalística" },
{ codigo: "CRI-59", nombre: "Juicios Orales Penales" },
{ codigo: "CRI-60", nombre: "Criminología" },
{ codigo: "CRI-61", nombre: "Derecho Procesal Civil" }, 
  
      // Ingeniería Industrial
      { codigo: "ING-01", nombre: "Cálculo Integral Aplicado" },
      { codigo: "ING-02", nombre: "Química General" },
      { codigo: "ING-03", nombre: "Mecánica I" },
      { codigo: "ING-04", nombre: "Evolución Prospectiva de la Ingeniería Industrial" },
      { codigo: "ING-05", nombre: "Fundamentos de Administración" },
      { codigo: "ING-06", nombre: "Probabilidad" },
      { codigo: "ING-07", nombre: "Procesamiento Automático de la Información" },
      { codigo: "ING-08", nombre: "Cálculo Integral Aplicado" },
      { codigo: "ING-09", nombre: "Investigación de Operaciones I" },
      { codigo: "ING-10", nombre: "Mecánica II" },
      { codigo: "ING-11", nombre: "Métodos y Procedimientos de Trabajo" },
      { codigo: "ING-12", nombre: "Economía" },
      { codigo: "ING-13", nombre: "Estadística para Ingeniería" },
      { codigo: "ING-14", nombre: "Diseño y Manufactura Asistido por Computadora CAD/CAM" },
      { codigo: "ING-15", nombre: "Álgebra Lineal" },
      { codigo: "ING-16", nombre: "Investigación de Operaciones II" },
      { codigo: "ING-17", nombre: "Electricidad y Magnetismo" },
      { codigo: "ING-18", nombre: "Estructuras Empresariales" },
      { codigo: "ING-19", nombre: "Administración de la Satisfacción al Cliente" },
      { codigo: "ING-20", nombre: "Métodos Numéricos Aplicados a la Ingeniería" },
      { codigo: "ING-21", nombre: "Gestión y Abastecimiento de Almacenes" },
      { codigo: "ING-22", nombre: "Procesos Industriales y de Manufactura I" },
      { codigo: "ING-23", nombre: "Planeación de Materiales y Capacidades" },
      { codigo: "ING-24", nombre: "Planeación Estratégica" },
      { codigo: "ING-25", nombre: "Estructuras y Sistemas Administrativos" },
      { codigo: "ING-26", nombre: "Administración de Transporte de Materiales" },
      { codigo: "ING-27", nombre: "Desarrollo e Innovación de Productos" },
      { codigo: "ING-28", nombre: "Recursos Humanos" },
      { codigo: "ING-29", nombre: "Procesos Industriales y de Manufactura II" },
      { codigo: "ING-30", nombre: "Optimización de las Instalaciones Industriales" },
      { codigo: "ING-31", nombre: "Planeación de Recursos de Manufactura" },
      { codigo: "ING-32", nombre: "Control de Procesos Industriales" },
      { codigo: "ING-33", nombre: "Administración de la Calidad" },
      { codigo: "ING-34", nombre: "Costos Aplicados a la Ingeniería" },
      { codigo: "ING-35", nombre: "Desarrollo Organizacional" },
      { codigo: "ING-36", nombre: "Administración Aplicada a la Industria" },
      { codigo: "ING-37", nombre: "Mantenimiento Industrial" },
      { codigo: "ING-38", nombre: "Habilidades Gerenciales" },
      { codigo: "ING-39", nombre: "Sistemas de Información para la Producción (MRP y ERP)" },
      { codigo: "ING-40", nombre: "Calidad Total" },
      { codigo: "ING-41", nombre: "Mercadotecnia y Ventas" },
      { codigo: "ING-42", nombre: "Relaciones Laborales" },
      { codigo: "ING-43", nombre: "Administración de la Cadena de Suministros" },
      { codigo: "ING-44", nombre: "Investigación Aplicada" },
      { codigo: "ING-45", nombre: "Desarrollo y Evaluación de Proyectos" },
      { codigo: "ING-46", nombre: "Ingeniería Financiera" },
      { codigo: "ING-47", nombre: "Tecnología de Materiales" },
      { codigo: "ING-48", nombre: "Comercio Internacional" },
      { codigo: "ING-49", nombre: "Capacitación y Desarrollo Laboral" },
      { codigo: "ING-50", nombre: "Comercio Internacional" },
{ codigo: "ING-51", nombre: "Desarrollo Organizacional" },
{ codigo: "ING-52", nombre: "Ingeniería Financiera" },
{ codigo: "ING-53", nombre: "Administración de la Satisfacción del Cliente" },
{ codigo: "ING-54", nombre: "Administración de la Calidad" },
{ codigo: "ING-55", nombre: "Tecnología de los Materiales" },
  
    // Inicios - Escolarizado
      { codigo: "INI-01", nombre: "Computación I" },
      { codigo: "INI-02", nombre: "Introducción a la Pedagogía" },
      { codigo: "INI-03", nombre: "Introducción a la Psicología" },
      { codigo: "INI-04", nombre: "Administración General" },
      { codigo: "INI-05", nombre: "Neuropsicología" },
      { codigo: "INI-06", nombre: "Psicopatología II" },
      { codigo: "INI-07", nombre: "Psicofisiología II" },
      { codigo: "INI-08", nombre: "Organización de Proyectos y Grupos de Trabajo" },
      { codigo: "INI-09", nombre: "Sociología Organizacional" },
      { codigo: "INI-10", nombre: "Computación" },
      { codigo: "INI-11", nombre: "Derecho Mercantil" },
      { codigo: "INI-12", nombre: "Derecho Laboral" },



      //TRABAJO SOCIAL
      { codigo: "TSO-01", nombre: "Violencia Intrafamiliar" },

{ codigo: "TSO-02", nombre: "Garantías Sociales y Grupos Marginales" },

{ codigo: "TSO-03", nombre: "Campañas Preventivas" },

{ codigo: "TSO-04", nombre: "Administración del Trabajo Social Institucional y Educativo" },

{ codigo: "TSO-05", nombre: "Relaciones Públicas" },

{ codigo: "TSO-06", nombre: "El Trabajo Social y la Familia" },
    
    ];

  // Estados adicionales
const [searchTerm, setSearchTerm] = useState("");
const [showSuggestions, setShowSuggestions] = useState(false);
const wrapperRef = useRef(null); // Para cerrar sugerencias al hacer clic fuera

// Filtro de materias según carrera y término de búsqueda
const materiasFiltradasPorCarrera = materias.filter(m =>
  carrera && m.codigo.startsWith(carrera)
);

const materiasSugeridas = materiasFiltradasPorCarrera.filter(m =>
  m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
);

// Manejo de selección de materia
const handleSelectMateria = (materia) => {
  setSearchTerm(materia.nombre);
  setId_materia(materia.nombre); // o materia.nombre según tu lógica
  setShowSuggestions(false);
};

// Al cambiar de carrera, limpiar todo
const handleCarreraChange = (e) => {
  setCarrera(e.target.value);
  setSearchTerm("");
  setId_materia("");
  setShowSuggestions(false);
};


  const materiasFiltradas = materias.filter(m =>
    carrera !== "" && m.codigo.startsWith(carrera)
  );

  // ================= SUBMIT =================
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validar campos
    if (!carrera || !id_materia || calificacion_final === "") {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos.',
      });
      return;
    }

    // Confirmación antes de guardar
    const confirm = await Swal.fire({
      title: '¿Guardar calificación?',
      text: 'Se registrará la calificación en Supabase',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7c3aed'
    });
    if (!confirm.isConfirmed) return;

    try {
      // 1. Obtener el correo del alumno desde la tabla 'alumnos'
      const { data: alumno, error: errorAlumno } = await supabase
        .from('alumnos')
        .select('correo')
        .eq('id', id)
        .single();

      if (errorAlumno || !alumno) {
        throw new Error('No se encontró el alumno o no tiene correo asociado');
      }

      const correoAlumno = alumno.correo;

      // 2. Preparar el registro de calificación
      const nuevaCalificacion = {
        correo: correoAlumno,
        id_alumno: id,
        materia: id_materia,
        calificacion: Number(calificacion_final),
        fecha_registro: new Date().toISOString()
      };

      // 3. Usar upsert para evitar duplicados (correo + materia + grupo como
      // clave única; esta captura manual no tiene grupo asociado, así que
      // sigue funcionando como antes: una fila por correo+materia)
      const { error: upsertError } = await supabase
        .from('calificaciones')
        .upsert(nuevaCalificacion, {
          onConflict: 'correo,materia,id_grupo_key'  // ver migración calificaciones_correo_materia_grupo_key en Supabase
        });

      if (upsertError) throw upsertError;

      // 4. Éxito
      Swal.fire({
        icon: 'success',
        title: '¡Calificación registrada!',
        text: 'Los datos se han guardado correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });


    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: err.message || 'Ocurrió un problema al registrar la calificación.',
      });
    }
  };

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar titulo="Subir Calificación" />

      <div className="mt-10 ml-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center bg-purple-200 text-purple-800 px-4 py-2 rounded-md hover:bg-purple-300 transition mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>
      </div>

      <div className="flex justify-center mt-10">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg border border-purple-200">
          <h2 className="text-2xl font-semibold text-center text-purple-800 mb-6">
            Registrar Calificación Final
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Carrera */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Carrera</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                value={carrera}
                onChange={e => {
                  setCarrera(e.target.value);
                  setId_materia("");
                }}
              >
                <option value="">Selecciona una carrera</option>
                {carreras.map(c => (
                  <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Materia */}
            <div ref={wrapperRef} className="relative">
  <label className="block text-gray-700 font-medium mb-1">Materia</label>
  <input
    type="text"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
    placeholder={carrera ? "Escribe para buscar..." : "Primero selecciona una carrera"}
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setId_materia(""); // Limpia la selección al escribir
      setShowSuggestions(true);
    }}
    onFocus={() => carrera && setShowSuggestions(true)}
    disabled={!carrera}
  />

  {showSuggestions && carrera && materiasSugeridas.length > 0 && (
    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
      {materiasSugeridas.map((m) => (
        <li
          key={m.codigo}
          className="px-4 py-2 hover:bg-purple-100 cursor-pointer"
          onClick={() => handleSelectMateria(m)}
        >
          {m.nombre}
        </li>
      ))}
    </ul>
  )}
</div>

            {/* Calificación Final */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Calificación Final</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0 - 10"
                value={calificacion_final}
                onChange={e => setCalificacionFinal(e.target.value)}
              />
            </div>

            {/* Botón */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-purple-900 transition-all"
              >
                Registrar Calificación
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}