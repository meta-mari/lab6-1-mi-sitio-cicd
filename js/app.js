const boton = document.getElementById("btnMensaje");
const mensaje = document.getElementById("mensaje");

boton.addEventListener("click", () => {
  const fecha = new Date().toLocaleString("es-BO");

  mensaje.textContent = `JavaScript funcionando correctamente. Fecha local: ${fecha}`;
});
