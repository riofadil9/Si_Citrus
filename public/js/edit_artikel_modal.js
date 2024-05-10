// public/js/edit_artikel_modal.js
// Script to control edit artikel modal

// Function to populate modal with current artikel data
function populateModal(artikel) {
    document.getElementById('namaArtikel').value = artikel.namaArtikel;
    // Populate other input fields with artikel data
  }
  
  // Event listener to show modal and populate with current artikel data
  $('#editModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    var artikel = button.data('artikel'); // Extract info from data-* attributes
    populateModal(artikel);
  });
  