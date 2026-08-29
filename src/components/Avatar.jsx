import React from "react";

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
