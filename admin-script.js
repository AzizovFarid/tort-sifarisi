// admin-script.js - Local Storage əsasında tam funksional versiya

// --- Sabitlər və İlkin Məlumat ---
const DATA_KEY = 'tortSifarisiAdminData';
let appData;

const DEFAULT_DATA = {
    config: {
        markupPercent: 50
    },
    inventory: [
        { id: 101, name: "Yumurta", unit: "ədəd", stock: 150, min_level: 50, price: 0.20 },
        { id: 102, name: "Un", unit: "kq", stock: 12, min_level: 5, price: 1.50 },
        { id: 103, name: "Kakao", unit: "kq", stock: 2, min_level: 3, price: 8.00 },
        { id: 104, name: "Şəkər", unit: "kq", stock: 50, min_level: 20, price: 1.20 }
    ],
    recipes: [
        { id: 1, name: "Quru Südlü Tortu", time: "120 dəq", ingredients: [{ name: "Un", amount: 0.5, unit: "kq" }, { name: "Yumurta", amount: 6, unit: "ədəd" }, { name: "Şəkər", amount: 0.3, unit: "kq" }], base_cost: 0, sale_price: 0 },
        { id: 2, name: "Qırmızı Məxmər", time: "180 dəq", ingredients: [{ name: "Un", amount: 0.8, unit: "kq" }, { name: "Yumurta", amount: 8, unit: "ədəd" }, { name: "Kakao", amount: 0.1, unit: "kq" }], base_cost: 0, sale_price: 0 },
    ],
    orders: [
        { id: 1, customer: "Əli Quliyev", cake: "Quru Südlü Tortu", weight: 1.5, price: 45.00, date: "2025-12-15", status: "Yeni" },
        { id: 2, customer: "Aynur Məmmədova", cake: "Qırmızı Məxmər", weight: 2.0, price: 60.00, date: "2025-12-14", status: "Hazırlanır" },
        { id: 3, customer: "Vüqar Həsənov", cake: "Quru Südlü Tortu", weight: 1.0, price: 30.00, date: "2025-12-10", status: "Göndərildi" },
    ],
};

// --- Helper Funksiyalar ---

function initializeData() {
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        appData = JSON.parse(storedData);
    } else {
        appData = DEFAULT_DATA;
        saveData();
    }
    calculateAllCakePrices();
    document.getElementById('markupPercent').value = appData.config.markupPercent;
}

function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(appData));
}

// Python-dakı calculate_cost funksiyasını simulyasiya edir
function calculateCost(recipe) {
    let totalCost = 0;
    const markup = appData.config.markupPercent / 100;

    recipe.ingredients.forEach(ing => {
        const item = appData.inventory.find(i => i.name === ing.name);
        if (item) {
            totalCost += ing.amount * item.price;
        }
    });

    // Əsas maya dəyəri + Markup
    const salePrice = totalCost * (1 + markup);
    return { base_cost: totalCost.toFixed(2), sale_price: salePrice.toFixed(2) };
}

function calculateAllCakePrices() {
    appData.recipes.forEach(recipe => {
        const { base_cost, sale_price } = calculateCost(recipe);
        recipe.base_cost = base_cost;
        recipe.sale_price = sale_price;
    });
    saveData();
}

// --- A. Məlumatları Yükləyən Funksiyalar ---

function loadRecipes() {
    calculateAllCakePrices(); // Markup dəyişikliyindən sonra qiymətləri yenilə
    const recipesList = document.getElementById('recipesList');
    recipesList.innerHTML = '';
    
    appData.recipes.forEach(recipe => {
        const { sale_price, base_cost } = calculateCost(recipe);
        
        const ingredientsText = recipe.ingredients.map(i => `${i.name} (${i.amount} ${i.unit})`).join(', ');

        const row = recipesList.insertRow();
        row.innerHTML = `
            <td>${recipe.name}</td>
            <td>${recipe.time}</td>
            <td title="${ingredientsText}">${ingredientsText.substring(0, 40)}...</td>
            <td>${sale_price} AZN (M.D.: ${base_cost} AZN)</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editRecipe(${recipe.id})"><i class="fas fa-edit"></i> Redaktə</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecipe(${recipe.id})"><i class="fas fa-trash-alt"></i> Sil</button>
            </td>
        `;
    });
}

function loadOrders() {
    const filterValue = document.getElementById('statusFilter').value;
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    const filteredOrders = appData.orders.filter(order => filterValue === 'all' || order.status === filterValue);

    filteredOrders.forEach(order => {
        const statusClass = order.status === 'Yeni' ? 'new' : 
                            order.status === 'Hazırlanır' ? 'in-progress' : 
                            order.status === 'Göndərildi' ? 'delivered' : 'cancelled';

        const row = ordersList.insertRow();
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.cake}</td>
            <td>${order.weight.toFixed(2)}</td>
            <td>${order.price.toFixed(2)} AZN</td>
            <td>${order.date}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i> Bax</button>
                <button class="btn btn-success btn-sm" onclick="updateOrderStatus(${order.id}, 'Hazırlanır')"><i class="fas fa-hammer"></i></button>
            </td>
        `;
    });
}

function loadInventory() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    
    appData.inventory.sort((a, b) => a.name.localeCompare(b.name));

    appData.inventory.forEach(item => {
        const isLow = item.stock < item.min_level;
        const row = inventoryList.insertRow();
        row.className = isLow ? 'table-low-stock' : '';
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td>${item.stock}</td>
            <td>${item.min_level}</td>
            <td>${item.price.toFixed(2)} AZN</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editInventoryItem(${item.id})"><i class="fas fa-edit"></i> Redaktə</button>
            </td>
        `;
    });

    // Anbar Xəbərdarlıqları (get_low_inventory funksionallığı)
    const lowStockItems = appData.inventory.filter(item => item.stock < item.min_level).map(item => item.name);
    const alertElement = document.getElementById('inventoryAlert');
    
    if (lowStockItems.length > 0) {
        alertElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> DİQQƏT: Aşağı qalıqlı məhsullar: <b>${lowStockItems.join(', ')}</b>`;
        alertElement.className = 'alert alert-warning';
    } else {
        alertElement.innerHTML = `<i class="fas fa-info-circle"></i> Bütün məhsullar normal səviyyədədir.`;
        alertElement.className = 'alert alert-info';
    }
}

function loadPrices() {
    const pricesList = document.getElementById('pricesList');
    pricesList.innerHTML = '';

    appData.inventory.forEach(item => { // Ingredient qiymətləri Anbar məlumatlarıdır
        const row = pricesList.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td id="price-${item.id}">${item.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editIngredientPrice(${item.id}, '${item.name}', ${item.price})"><i class="fas fa-edit"></i> Redaktə</button>
            </td>
        `;
    });
}


// --- B. Əməliyyat Funksiyaları (CRUD) ---

// Reseptlər
function addNewCake() {
    alert("Yeni Resept əlavə et funksiyası (Modal pəncərə) - Məlumatları doldurun.");
    // Məsələn: promptla yeni tort adı soruşub appData.recipes əlavə etmək olar.
}

function deleteRecipe(id) {
    if (confirm("Bu resepti silməyə əminsinizmi?")) {
        appData.recipes = appData.recipes.filter(r => r.id !== id);
        saveData();
        loadRecipes();
    }
}

function refreshRecipes() { loadRecipes(); }


// Sifarişlər
function filterOrders() { loadOrders(); }

function viewOrder(id) {
    const order = appData.orders.find(o => o.id === id);
    alert(`Sifariş ID: ${order.id}\nStatus: ${order.status}\nMüştəri: ${order.customer}\nQiymət: ${order.price} AZN`);
}

function updateOrderStatus(id, newStatus) {
    const order = appData.orders.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
        alert(`Sifariş ID ${id} statusu '${newStatus}' olaraq dəyişdirildi.`);
        saveData();
        loadOrders();
    }
}


// Anbar
function addInventoryItem() {
    alert("Yeni Məhsul əlavə et funksiyası (Modal pəncərə) - Məlumatları doldurun.");
}

function editInventoryItem(id) {
    const item = appData.inventory.find(i => i.id === id);
    if (item) {
        const newStock = prompt(`"${item.name}" (Hazırkı qalıq: ${item.stock} ${item.unit}) üçün yeni qalıq miqdarını daxil edin:`);
        if (newStock !== null && !isNaN(parseFloat(newStock))) {
            item.stock = parseFloat(newStock);
            saveData();
            loadInventory();
            alert(`"${item.name}" qalığı ${item.stock} olaraq yeniləndi.`);
        } else if (newStock !== null) {
            alert("Xəta: Zəhmət olmasa düzgün rəqəm daxil edin.");
        }
    }
}

function refreshInventory() { loadInventory(); }


// Qiymətlər
function editIngredientPrice(id, name, currentPrice) {
    const newPrice = prompt(`"${name}" (Hazırkı qiymət: ${currentPrice} AZN) üçün yeni qiyməti daxil edin:`);
    if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
        const item = appData.inventory.find(i => i.id === id);
        if (item) {
            item.price = parseFloat(newPrice);
            saveData();
            loadPrices();
            alert(`"${name}" qiyməti ${item.price.toFixed(2)} AZN olaraq yeniləndi.`);
        }
    } else if (newPrice !== null) {
        alert("Xəta: Zəhmət olmasa düzgün qiymət daxil edin.");
    }
}

function savePrices() {
    const markupPercentInput = document.getElementById('markupPercent');
    const newMarkup = parseFloat(markupPercentInput.value);

    if (!isNaN(newMarkup) && newMarkup >= 0) {
        appData.config.markupPercent = newMarkup;
        saveData();
        calculateAllCakePrices(); // Markup dəyişdikdən sonra resept qiymətlərini yenilə
        alert(`Markup Faizi (${newMarkup}%) və Ingredient Qiymətləri yadda saxlandı.`);
    } else {
        alert("Xəta: Zəhmət olmasa Markup üçün düzgün rəqəm daxil edin.");
    }
}


// --- C. İnterfeys İdarəetmə Funksiyası ---

function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    
    const activeTabButton = document.querySelector(`.tabs button[onclick*="${tabId}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }

    // Sekmələrə keçəndə məlumatları yüklə
    if (tabId === 'recipes') loadRecipes();
    if (tabId === 'orders') loadOrders();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'prices') loadPrices();
}

// Səhifə yükləndikdə tətbiqi başla
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    // HTML-də 'recipes' tabı aktiv olduğu üçün, onun funksiyasını çağırırıq
    switchTab('recipes');
});
