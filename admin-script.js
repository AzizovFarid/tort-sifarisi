// admin-script.js (Genişləndirilmiş versiya)

// --- A. DATA YÜKLƏMƏ FUNKSİYALARI (Python funksiyalarının Oxumaq hissəsi) ---

// Reseptləri yükləyir (get_recipes-ə uyğun gəlir)
async function loadRecipes() {
    // FƏRZİYYƏ: Serverdən resept məlumatlarını çəkir
    // const response = await fetch('/api/recipes');
    // const recipes = await response.json();

    // Nümunə verilənlər (Server cavabını simulyasiya edir)
    const recipes = [
        { id: 1, name: "Quru Südlü Tortu", time: "120 dəq", ingredients: "Yumurta, Şəkər, Un, Jelatin, Kərə yağı, Süd, Kakao, asd, sdf" },
        { id: 2, name: "Test Tortu", time: "120 dəq", ingredients: "asd, dfsasd, cxds" },
        // ...
    ];

    const recipesList = document.getElementById('recipesList');
    recipesList.innerHTML = ''; // Cədvəli təmizlə
    
    recipes.forEach(recipe => {
        const row = recipesList.insertRow();
        row.innerHTML = `
            <td>${recipe.name}</td>
            <td>${recipe.time}</td>
            <td>${recipe.ingredients}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editRecipe(${recipe.id})"><i class="fas fa-edit"></i> Redaktə</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecipe(${recipe.id})"><i class="fas fa-trash-alt"></i> Sil</button>
            </td>
        `;
    });
}


// Anbar məlumatlarını yükləyir (get_inventory-ə uyğun gəlir)
async function loadInventory() {
    // FƏRZİYYƏ: Serverdən anbar məlumatlarını çəkir
    // const response = await fetch('/api/inventory');
    // const items = await response.json();

    // Nümunə verilənlər
    const items = [
        { id: 101, name: "Yumurta", unit: "ədəd", stock: 150, min_level: 50, price: 0.20 },
        { id: 102, name: "Un", unit: "kq", stock: 12, min_level: 5, price: 1.50 },
        { id: 103, name: "Kakao", unit: "kq", stock: 2, min_level: 3, price: 8.00 }, // Minimumdan az
    ];

    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    
    // Anbar cədvəlini doldur
    items.forEach(item => {
        const isLow = item.stock < item.min_level;
        const row = inventoryList.insertRow();
        row.className = isLow ? 'table-danger' : ''; // Əgər stok azdırsa, sətri qırmızı et
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.stock}</td>
            <td>${item.min_level}</td>
            <td>${item.price.toFixed(2)} AZN</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="updateInventory(${item.id})"><i class="fas fa-cog"></i> Tənzimlə</button>
            </td>
        `;
    });

    // Minimum anbar məlumatını göstər (get_low_inventory funksionallığı)
    const lowStockItems = items.filter(item => item.stock < item.min_level).map(item => item.name);
    const alertElement = document.getElementById('inventoryAlert');
    
    if (lowStockItems.length > 0) {
        alertElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> DİQQƏT: Aşağı qalıqlı məhsullar: ${lowStockItems.join(', ')}`;
        alertElement.className = 'alert alert-danger';
    } else {
        alertElement.innerHTML = `<i class="fas fa-check-circle"></i> Bütün məhsullar normal səviyyədədir.`;
        alertElement.className = 'alert alert-success';
    }
}


// --- B. ƏMƏLİYYAT FUNKSİYALARI (Python funksiyalarının Yaratmaq/Yeniləmək/Silmək hissəsi) ---

// add_recipe funksionallığı
function addNewCake() {
    // Burada modal pəncərə və ya form açılmalıdır.
    alert("Yeni Tort əlavə etmək üçün form açılır.");
    // Məlumatları API-yə göndərmək üçün:
    // fetch('/api/recipes', { method: 'POST', body: JSON.stringify(data) }).then(loadRecipes);
}

// edit_recipe funksionallığı
function editRecipe(id) {
    alert(`Resept ID ${id} redaktə edilir.`);
}

// delete_recipe funksionallığı
function deleteRecipe(id) {
    if (confirm(`Resept ID ${id} silinməsini təsdiqləyirsinizmi?`)) {
        // fetch(`/api/recipes/${id}`, { method: 'DELETE' }).then(loadRecipes);
        alert(`Resept ${id} silindi.`);
    }
}

// update_inventory funksionallığı
function updateInventory(id) {
    const newStock = prompt(`Məhsul ID ${id} üçün yeni qalıq miqdarını daxil edin:`);
    if (newStock) {
        // fetch(`/api/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ stock: newStock }) }).then(loadInventory);
        alert(`Məhsul ${id} qalığı ${newStock} olaraq yeniləndi.`);
        loadInventory();
    }
}

// update_unit_price funksionallığı (və `savePrices` daxilində)
function savePrices() {
    const markupPercent = document.getElementById('markupPercent').value;
    // Bütün ingredient qiymətlərini topla
    const pricesData = []; 
    
    // FƏRZİYYƏ: Bütün məlumatları bir API zəngi ilə göndərmək
    // fetch('/api/prices/update', { method: 'PUT', body: JSON.stringify({ markup: markupPercent, prices: pricesData }) });

    alert(`Qiymətlər yadda saxlandı. Yeni Markup: ${markupPercent}%.`);
}


// --- C. İNTERFEYS İDARƏETMƏ FUNKSİYALARI (Əvvəlki cavabdan saxlanılır) ---

function switchTab(tabId) {
    // ... (Əvvəlki switchTab funksiyasının kodu burada qalır)

    // Hər sekməyə keçəndə məlumatları yüklə
    if (tabId === 'recipes') loadRecipes();
    if (tabId === 'inventory') loadInventory();
    // loadOrders() və loadPrices() da əlavə edilməlidir
}

// Səhifə yükləndikdə ilk funksiyaların çağırılması
document.addEventListener('DOMContentLoaded', () => {
    switchTab('recipes'); // Səhifə başlayanda reseptləri yüklə
});

// filterOrders funksiyası olduğu kimi qalır
function filterOrders() {
    // ... (Əvvəlki filterOrders funksiyasının kodu burada qalır)
}

// Placeholder funksiyalar
function refreshRecipes() { loadRecipes(); }
function refreshInventory() { loadInventory(); }
