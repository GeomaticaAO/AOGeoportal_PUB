// Obtenemos el contenedor que agrupa el panel + botón
document.addEventListener('DOMContentLoaded', function() {
  const sidebarContainer = document.getElementById('sidebarContainer');
  const toggleBtn = document.getElementById('toggleBtn');

  if (sidebarContainer && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      // Alterna la clase 'oculto' en el contenedor lateral
      sidebarContainer.classList.toggle('oculto');
      setTimeout(() => {
      }, 300);
    });
  } else {
    console.error('No se encontraron los elementos del sidebar');
  }
});


