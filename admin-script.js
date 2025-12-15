// admin-script.js - Əsas Event Listener strukturu

const DATA_KEY = 'tortSifarisiAdminData';
let adminAppData = { recipes: [], inventory: [], orders: [], config: { markupPercent: 50 } };

// --- Helper Funksiyalar ---

function loadAdminData() {
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        // Məlumatı yüklə
        adminAppData = JSON.parse(storedData);
    } 
    // Məlumat olmasa, yuxarıdakı default dəyəri istifadə edəcək
    renderAllData(); // Məlumat yükləndikdən sonra bütün siyahıları yenilə
}

function saveAdminData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(adminAppData));
    alert("Məlumatlar yadda saxlanıldı!");
}

/**
 * Tab dəyişdirmə funksiyası
 */
function switchTab(event) {
    const tabTarget = event.target.closest('.tab');
    if (!tabTarget) return;

    const tabId = tabTarget.getAttribute('data-tab-target');
    if (!tabId) return;

    // Aktiv tabı dəyiş
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    tabTarget.classList.add('active');

    // Hər tab açılanda datanı yenilə (lazım gələrsə)
    renderAllData(); 
}

// --- Tab Siyahılarını Yükləyən Əsas Funksiyalar ---

function renderRecipes() {
    // #recipesList-i doldurmaq üçün məntiq
    const listBody = document.getElementById('recipesList');
    listBody.innerHTML = '';
    
    // Nümunə:
    /*
    adminAppData.recipes.forEach(recipe => {
        const row = listBody.insertRow();
        row.innerHTML = `
            <td>${recipe.name}</td>
            <td>${recipe.time}</td>
            <td>...</td>
            <td>${calculateCost(recipe).toFixed(2)} AZN</td>
            <td>
                <button class="btn btn-sm btn-info edit-recipe-btn" data-name="${recipe.name}">Redaktə</button>
                <button class="btn btn-sm btn-danger delete-recipe-btn" data-name="${recipe.name}">Sil</button>
            </td>
        `;
    });
    */
}

function renderOrders(filter = 'all') {
    // #ordersList-i doldurmaq üçün məntiq
    const listBody = document.getElementById('ordersList');
    listBody.innerHTML = '';
    
    // Filterləmə məntiqi
    const filteredOrders = adminAppData.orders.filter(order => 
        filter === 'all' || order.status === filter
    );

    // Nümunə:
    /*
    filteredOrders.forEach(order => {
        const row = listBody.insertRow();
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.cake}</td>
            <td>${order.weight.toFixed(2)}</td>
            <td>${order.price.toFixed(2)} AZN</td>
            <td>${order.date}</td>
            <td><span class="status-${order.status}">${order.status}</span></td>
            <td>
                <select class="form-control order-status-select" data-id="${order.id}">
                   <option selected>${order.status}</option>
                   </select>
            </td>
        `;
    });
    */
}

function renderInventory() {
    // #inventoryList-i doldurmaq üçün məntiq
}

function renderPrices() {
    // Markup inputunu yenilə
    document.getElementById('markupPercent').value = adminAppData.config.markupPercent || 50;
    
    // #pricesList-i doldurmaq üçün məntiq
}

function renderAllData() {
    // Aktiv tabı yoxla və uyğun funksiyanı çağır
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const id = activeTab.id;
    if (id === 'recipes') renderRecipes();
    else if (id === 'orders') {
        const filter = document.getElementById('statusFilter').value;
        renderOrders(filter);
    }
    else if (id === 'inventory') renderInventory();
    else if (id === 'prices') renderPrices();
}

// --- Funksiya Şablonları (HTML-dən silinənlər) ---

function addNewCake() {
    // Yeni tort əlavə etmək üçün modalı açmaq və ya formu göstərmək məntiqi
    alert("Yeni Tort əlavə et funksiyası aktivləşdirildi.");
}

function refreshRecipes() {
    // Reseptlər siyahısını yenidən yüklə
    renderRecipes();
    alert("Reseptlər siyahısı yeniləndi.");
}

function filterOrders() {
    // Status filtri dəyişdikdə sifarişləri yenilə
    const filterValue = document.getElementById('statusFilter').value;
    renderOrders(filterValue);
}

function addInventoryItem() {
    // Yeni anbar məhsulu əlavə etmək məntiqi
    alert("Yeni Məhsul əlavə et funksiyası aktivləşdirildi.");
}

function refreshInventory() {
    // Anbar siyahısını yenilə
    renderInventory();
    alert("Anbar siyahısı yeniləndi.");
}

function savePrices() {
    // Markup və ingredient qiymətlərini yadda saxlamaq məntiqi
    const markup = parseFloat(document.getElementById('markupPercent').value) || 0;
    adminAppData.config.markupPercent = markup;
    
    // Digər qiymət dəyişikliklərini yadda saxla (pricesList-dən)
    // ...
    
    saveAdminData();
}


// --- Event Listener-lərin Birləşdirilməsi ---

document.addEventListener('DOMContentLoaded', () => {
    loadAdminData(); // Başlanğıcda bütün məlumatları yüklə

    // 1. Tab Naviqasiyası
    document.querySelectorAll('.tabs').forEach(tabContainer => {
         tabContainer.addEventListener('click', (e) => {
            if (e.target.closest('.tab')) {
                switchTab(e);
            }
         });
    });

    // 2. Resept Tabı Eventləri
    document.getElementById('addNewCakeBtn').addEventListener('click', addNewCake);
    document.getElementById('refreshRecipesBtn').addEventListener('click', refreshRecipes);

    // 3. Sifariş Tabı Eventləri
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    
    // Qeyd: Sifariş statusunun dəyişdirilməsi üçün məntiq #ordersList-in renderində edilməlidir (Event Delegation)
    
    // 4. Anbar Tabı Eventləri
    document.getElementById('addInventoryItemBtn').addEventListener('click', addInventoryItem);
    document.getElementById('refreshInventoryBtn').addEventListener('click', refreshInventory);

    // 5. Qiymətlər Tabı Eventləri
    document.getElementById('savePricesBtn').addEventListener('click', savePrices);
});
