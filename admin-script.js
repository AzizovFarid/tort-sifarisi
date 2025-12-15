// admin-script.js - GitHub JSON və Local Storage ilə tam funksional versiya (ASYNC)

const DATA_KEY = 'tortSifarisiAdminData';
let appData;
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/cake_images_v17/';
const JSON_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/data/';

const JSON_URLS = {
    recipes: JSON_BASE_URL + 'recipes_v17.json',
    orders: JSON_BASE_URL + 'orders_v19.json',
    config: JSON_BASE_URL + 'config_v19.json',
    inventory: JSON_BASE_URL + 'inventory_v1.json',
};

// --- Helper Funksiyalar ---

/**
 * GitHub-dan ilkin məlumatları çəkir və JS-ə uyğun array formatına çevirir.
 */
async function fetchGitHubData() {
    try {
        const [recipesRes, ordersRes, configRes, inventoryRes] = await Promise.all([
            fetch(JSON_URLS.recipes),
            fetch(JSON_URLS.orders),
            fetch(JSON_URLS.config),
            fetch(JSON_URLS.inventory)
        ]);

        const recipesData = await recipesRes.json();
        const ordersData = await ordersRes.json();
        const configData = await configRes.json();
        const inventoryData = await inventoryRes.json();
        
        // Python-dakı obyekt/dictionary strukturlarını JS array formatına çeviririk
        
        const recipesArray = Object.keys(recipesData).map((key, index) => ({
            id: index + 1, // Reseptləri ID ilə işləmək üçün
            name: key,
            time: recipesData[key].prep_time || "N/A",
            image_file: recipesData[key].images.default || "no_image.png",
            ingredients: Object.keys(recipesData[key].ingredients).map(ingKey => ({
                name: ingKey,
                amount: recipesData[key].ingredients[ingKey].amount,
                unit: recipesData[key].ingredients[ingKey].unit || "ədəd"
            }))
        }));

        // Inventory Data
        const inventoryArray = Object.keys(inventoryData).map((key, index) => ({
            id: index + 100, // Anbar ID-ləri
            name: key,
            ...inventoryData[key] // unit, price, stock, min_level
        }));


        return {
            config: { markupPercent: configData.markup_percent || 50 },
            inventory: inventoryArray,
            recipes: recipesArray,
            orders: ordersData 
        };

    } catch (error) {
        console.error("GitHub-dan məlumat çəkilərkən xəta baş verdi.", error);
        return null;
    }
}


/**
 * Məlumatları Local Storage-dan və ya GitHub-dan yükləyir.
 */
async function initializeData() {
    const storedData = localStorage.getItem(DATA_KEY);
    const alertElement = document.getElementById('recipesAlert');
    
    if (storedData) {
        appData = JSON.parse(storedData);
        alertElement.innerHTML = `<i class="fas fa-info-circle"></i> Local Storage-dan yükləndi. Dəyişikliklər yalnız sizin brauzerinizdə saxlanılır.`;
    } else {
        const githubData = await fetchGitHubData();
        if (githubData) {
            appData = githubData;
            saveData(); 
            alertElement.innerHTML = `<i class="fas fa-info-circle"></i> GitHub JSON-dan ilkin məlumat yükləndi.`;
        } else {
            alertElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> XƏTA: İlkin məlumat bazası yüklənə bilmədi!`;
            return; 
        }
    }
    
    document.getElementById('markupPercent').value = appData.config.markupPercent;
    calculateAllCakePrices();
}

function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(appData));
}

/**
 * Python-dakı calculate_cost funksiyasını simulyasiya edir.
 */
function calculateCost(recipe) {
    let totalCost = 0;
    const markup = appData.config.markupPercent / 100;

    const inventoryMap = appData.inventory.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {});

    recipe.ingredients.forEach(ing => {
        const price = inventoryMap[ing.name];
        if (price !== undefined) {
            totalCost += ing.amount * price;
        }
    });

    const salePrice = totalCost * (1 + markup);
    return { base_cost: totalCost, sale_price: salePrice };
}

function calculateAllCakePrices() {
    if (!appData || !appData.recipes) return;
    appData.recipes.forEach(recipe => {
        const { base_cost, sale_price } = calculateCost(recipe);
        recipe.base_cost = base_cost;
        recipe.sale_price = sale_price;
    });
    saveData();
}

// --- A. Məlumatları Yükləyən Funksiyalar (LOAD) ---

function loadRecipes() {
    calculateAllCakePrices();
    const recipesList = document.getElementById('recipesList');
    recipesList.innerHTML = '';
    
    appData.recipes.forEach(recipe => {
        const ingredientsText = recipe.ingredients.map(i => `${i.name}`).join(', ');

        const row = recipesList.insertRow();
        row.innerHTML = `
            <td>${recipe.name}</td>
            <td>${recipe.time}</td>
            <td title="${ingredientsText}">${ingredientsText.substring(0, 40)}...</td>
            <td>${recipe.sale_price.toFixed(2)} AZN (M.D.: ${recipe.base_cost.toFixed(2)} AZN)</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editRecipe('${recipe.name}')"><i class="fas fa-edit"></i> Redaktə</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRecipe('${recipe.name}')"><i class="fas fa-trash-alt"></i> Sil</button>
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
                <button class="btn btn-primary btn-sm" onclick="editInventoryItem('${item.name}')"><i class="fas fa-edit"></i> Redaktə</button>
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
        alertElement.innerHTML = `<i class="fas fa-check-circle"></i> Bütün məhsullar normal səviyyədədir.`;
        alertElement.className = 'alert alert-info';
    }
}

function loadPrices() {
    const pricesList = document.getElementById('pricesList');
    pricesList.innerHTML = '';

    appData.inventory.forEach(item => { 
        const row = pricesList.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.unit}</td>
            <td id="price-${item.name.replace(/\s/g, '')}">${item.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editIngredientPrice('${item.name}', ${item.price})"><i class="fas fa-edit"></i> Redaktə</button>
            </td>
        `;
    });
}


// --- B. Əməliyyat Funksiyaları (CRUD/Logic) ---

// Reseptlər
function editRecipe(name) {
    const recipe = appData.recipes.find(r => r.name === name);
    let imagePath = recipe.image_file ? IMAGE_BASE_URL + recipe.image_file : 'Şəkil yoxdur.';
    
    alert(`Resept: ${recipe.name}\n\nMaya Dəyəri: ${recipe.base_cost.toFixed(2)} AZN\nSatış Qiyməti: ${recipe.sale_price.toFixed(2)} AZN\n\nŞəkil Yolu: ${imagePath}`);
}
function deleteRecipe(name) {
    if (confirm(`"${name}" reseptini silməyə əminsinizmi?`)) {
        appData.recipes = appData.recipes.filter(r => r.name !== name);
        saveData();
        loadRecipes();
    }
}
function refreshRecipes() { loadRecipes(); }

// Sifarişlər
function filterOrders() { loadOrders(); }
function viewOrder(id) {
    const order = appData.orders.find(o => o.id === id);
    alert(`Sifariş ID: ${order.id}\nStatus: ${order.status}\nMüştəri: ${order.customer}\nTort: ${order.cake}\nQiymət: ${order.price.toFixed(2)} AZN`);
}

// Anbar
function editInventoryItem(name) {
    const item = appData.inventory.find(i => i.name === name);
    if (item) {
        const newStock = prompt(`"${item.name}" (Hazırkı qalıq: ${item.stock} ${item.unit}) üçün yeni qalıq miqdarını daxil edin:`);
        if (newStock !== null && !isNaN(parseFloat(newStock))) {
            item.stock = parseFloat(newStock);
            saveData();
            loadInventory();
        } 
    }
}
function refreshInventory() { loadInventory(); }

// Qiymətlər
function editIngredientPrice(name, currentPrice) {
    const newPrice = prompt(`"${name}" (Hazırkı qiymət: ${currentPrice.toFixed(2)} AZN) üçün yeni qiyməti daxil edin:`);
    if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
        const item = appData.inventory.find(i => i.name === name);
        if (item) {
            item.price = parseFloat(newPrice);
            saveData();
            loadPrices();
            calculateAllCakePrices(); 
        }
    }
}

function savePrices() {
    const markupPercentInput = document.getElementById('markupPercent');
    const newMarkup = parseFloat(markupPercentInput.value);

    if (!isNaN(newMarkup) && newMarkup >= 0) {
        appData.config.markupPercent = newMarkup;
        saveData();
        calculateAllCakePrices(); 
        alert(`Markup Faizi (${newMarkup}%) yadda saxlandı. Resept qiymətləri yeniləndi.`);
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

    const tabElement = document.getElementById(tabId);
    if (tabElement) tabElement.classList.add('active');
    
    const activeTabButton = document.querySelector(`.tabs button[onclick*="${tabId}"]`);
    if (activeTabButton) activeTabButton.classList.add('active');

    // Məlumatları yüklə
    if (tabId === 'recipes') loadRecipes();
    if (tabId === 'orders') loadOrders();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'prices') loadPrices();
}

document.addEventListener('DOMContentLoaded', async () => {
    // Səhifə yüklənməzdən əvvəl məlumatları çək
    await initializeData(); 
    
    // İlk açılan tabı aktiv et
    const initialTabId = document.querySelector('.tab-content.active') ? document.querySelector('.tab-content.active').id : 'recipes';
    switchTab(initialTabId); 
});
