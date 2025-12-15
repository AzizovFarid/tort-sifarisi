// admin-script.js

/**
 * Sekmələr arasında keçid funksiyası
 * @param {string} tabId - Aktiv ediləcək sekmənin ID-si
 */
function switchTab(tabId) {
    // Bütün sekmə kontentlərini gizlət
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    // Bütün sekmə düymələrinin aktivliyini ləğv et
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Seçilmiş sekmə kontentini göstər
    document.getElementById(tabId).classList.add('active');
    
    // Aktiv düyməni işarələ
    const activeTabButton = document.querySelector(`.tabs button[onclick*="${tabId}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }

    // Əgər Qiymətlər səhifəsinə keçirsə, qiymətləri yüklə (əgər funksiya varsa)
    if (tabId === 'prices') {
        // loadPrices(); // Buraya qiymətləri yükləyən funksiya əlavə edə bilərsiniz
    }
}

/**
 * Sifarişləri statusa görə filterləyir
 */
function filterOrders() {
    const filterValue = document.getElementById('statusFilter').value;
    const ordersList = document.getElementById('ordersList');
    const rows = ordersList.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const statusCell = row.cells[6]; // Status sütunu 7-cidir (index 6)
        
        // Status elementini tapmaq
        const statusBadge = statusCell.querySelector('.status-badge');
        
        if (statusBadge) {
            const statusText = statusBadge.textContent.trim();

            if (filterValue === 'all' || statusText === filterValue) {
                row.style.display = ''; // Görünən et
            } else {
                row.style.display = 'none'; // Gizlət
            }
        }
    }
}


// Digər funksiyalar (addNewCake, refreshRecipes, addInventoryItem, refreshInventory, savePrices)
// real proyekt məntiqi (API çağırışları, məlumatların saxlanması) tələb edir və bu nümunədə sadəcə placeholder olaraq qalır.

function addNewCake() {
    alert("Yeni Tort əlavə et funksiyası işləyir!");
}
function refreshRecipes() {
    alert("Reseptlər yeniləndi.");
}
function addInventoryItem() {
    alert("Yeni Məhsul əlavə et funksiyası işləyir!");
}
function refreshInventory() {
    alert("Anbar məlumatları yeniləndi.");
}
function savePrices() {
    const markup = document.getElementById('markupPercent').value;
    alert(`Qiymətlər yadda saxlandı. Yeni Markup: ${markup}%`);
}

// Səhifə yükləndikdə ilk sekməni aktiv etmək (ehtiyac olsa)
// document.addEventListener('DOMContentLoaded', () => {
//     switchTab('recipes');
// });
