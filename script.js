// ============================================================
// VSF TIR CIBLE — script partagé
// ============================================================

// Menu mobile (☰)
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle");
  var liens = document.querySelector(".nav-liens");
  if (toggle && liens) {
    toggle.addEventListener("click", function () {
      liens.classList.toggle("ouvert");
    });
  }
});
