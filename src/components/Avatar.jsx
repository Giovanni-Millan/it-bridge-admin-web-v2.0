// Círculo de avatar reutilizado en todas las pantallas que listan/muestran
// personas (alumnos, profesores, psicólogos, admins): si la persona tiene
// `foto_url` (subida vía adminApi.uploadAvatar) se muestra la foto real;
// si no, se cae a un círculo con sus iniciales como respaldo — así nunca
// queda un espacio vacío/roto aunque falte la foto.
import React from "react";

// Arma las iniciales tomando la primera letra de nombre + apellido paterno
// + apellido materno (los que existan — `filter(Boolean)` descarta los que
// vengan vacíos/null, por ejemplo cuando no hay apellido materno).
export const getInitials = (nombre, apellidoPaterno, apellidoMaterno) =>
  [nombre, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .map((p) => p.trim()[0])
    .join("")
    .toUpperCase();

export default function Avatar({ fotoUrl, nombre, apellidoPaterno, apellidoMaterno, size = 40, className = "" }) {
  const dimension = `${size}px`;

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Avatar"}
        style={{ width: dimension, height: dimension, minWidth: dimension }}
        className={`rounded-full object-cover border border-purple-200 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: dimension, height: dimension, minWidth: dimension, fontSize: size * 0.4 }}
      className={`rounded-full bg-purple-200 text-purple-700 font-bold flex items-center justify-center border border-purple-300 ${className}`}
    >
      {getInitials(nombre, apellidoPaterno, apellidoMaterno) || "?"}
    </div>
  );
}
