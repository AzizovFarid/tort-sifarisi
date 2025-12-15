// Global dəyişənlər
let recipes = {};
let orders = [];
let inventory = {};
let config = {};
let currentTab = 'recipes';

// Səhifə yükləndikdə
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    setupEventListeners();
});

// Bütün məlumatları yüklə
async function loadAllData() {
    try {
        // JSON fayllarını yüklə
        const recipesResponse = await fetch('data/recipes_v17.json');
        recipes = await recipesResponse.json();
        
        const ordersResponse = await fetch('data/orders_v19.json');
        orders = await ordersResponse.json();
        
        const inventoryResponse = await fetch('data/inventory_v1.json');
        inventory = await inventoryResponse.json();
        
        const configResponse = await fetch('data/config_v19.json');
        config = await configResponse.json();
        
        // İlkin məlumatları göstər
        displayRecipes();
        displayOrders();
        displayInventory();
        displayPrices();
        
        console.log('Bütün məlumatlar yükləndi');
    } catch (error) {
        console.error('Məlumat yüklənmə xətası:', error);
        showAlert('Məlumat yüklənmə xətası. JSON fayllarını yoxlayın.', 'danger');
    }
}

// Tab dəyişdirici
function switchTab(tabName) {
    // Köhnə tab-ı gizlət
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Yeni tab-ı göstər
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    currentTab = tabName;
}

// Receptləri göstər
function displayRecipes() {
    const recipesList = document.getElementById('recipesList');
    recipesList.innerHTML = '';
    
    Object.keys(recipes).forEach(cakeName => {
        if (cakeName === 'Xeta') return;
        
        const cake = recipes[cakeName];
        const ingredients = Object.keys(cake.ingredients || {}).join(', ');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${cakeName}</strong></td>
            <td>${cake.prep_time || '120 dəq'}</td>
            <td>${ingredients}</td>
            <td>
                <button class="btn" onclick="editCake('${cakeName}')" style="background: #3498db; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn" onclick="deleteCake('${cakeName}')" style="background: #e74c3c; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        recipesList.appendChild(row);
    });
}

// Sifarişləri göstər
function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name}<br><small>${order.customer_phone}</small></td>
            <td>${order.cake_name}</td>
            <td>${parseFloat(order.weight).toFixed(3)} kg</td>
            <td>${parseFloat(order.sale_price).toFixed(2)} AZN</td>
            <td>${order.delivery_date}</td>
            <td>
                <span class="status-badge" style="
                    background: ${getStatusColor(order.status)};
                    color: white;
                    padding: 3px 10px;
                    border-radius: 20px;
                    font-size: 0.9em;
                ">${order.status}</span>
            </td>
            <td>
                <button class="btn" onclick="changeOrderStatus(${order.id}, 'Hazırlanır')" 
                        style="background: #f39c12; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn" onclick="changeOrderStatus(${order.id}, 'Göndərildi')" 
                        style="background: #27ae60; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn" onclick="changeOrderStatus(${order.id}, 'Ləğv edildi')" 
                        style="background: #e74c3c; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        ordersList.appendChild(row);
    });
}

// Anbar məlumatlarını göstər
function displayInventory() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';
    
    let lowStockCount = 0;
    
    Object.keys(inventory).forEach(itemName => {
        const item = inventory[itemName];
        const qty = parseFloat(item.qty || 0);
        const minLevel = parseFloat(item.min || 0);
        const isLow = minLevel > 0 && qty <= minLevel;
        
        if (isLow) lowStockCount++;
        
        const row = document.createElement('tr');
        row.style.backgroundColor = isLow ? '#ffebee' : '';
        row.innerHTML = `
            <td><strong>${itemName}</strong> ${isLow ? '⚠️' : ''}</td>
            <td>${item.unit || 'əd'}</td>
            <td>${qty.toFixed(3)}</td>
            <td>${minLevel.toFixed(3)}</td>
            <td>${parseFloat(item.price || 0).toFixed(3)} AZN</td>
            <td>
                <button class="btn" onclick="editInventoryItem('${itemName}')" 
                        style="background: #3498db; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn" onclick="receiveInventory('${itemName}')" 
                        style="background: #27ae60; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn" onclick="useInventory('${itemName}')" 
                        style="background: #f39c12; color: white; padding: 5px 10px; margin: 2px;">
                    <i class="fas fa-minus"></i>
                </button>
            </td>
        `;
        inventoryList.appendChild(row);
    });
    
    // Xəbərdarlıq mesajını yenilə
    const alertElement = document.getElementById('inventoryAlert');
    if (lowStockCount > 0) {
        alertElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            ${lowStockCount} məhsul minimum səviyyədən aşağıdır!
        `;
        alertElement.className = 'alert alert-danger';
    } else {
        alertElement.innerHTML = `
            <i class="fas fa-check-circle"></i> 
            Minimum səviyyədən aşağı məhsul yoxdur
        `;
        alertElement.className = 'alert alert-success';
    }
}

// Qiymətləri göstər
function displayPrices() {
    const pricesList = document.getElementById('pricesList');
    const markupPercent = document.getElementById('markupPercent');
    
    // Markup faizini göstər
    markupPercent.value = config.markup_percent || 50;
    
    // Qiymət cədvəlini təmizlə
    pricesList.innerHTML = '';
    
    // Bütün unikal ingredientləri tap
    const allIngredients = new Set();
    Object.values(recipes).forEach(cake => {
        Object.keys(cake.ingredients || {}).forEach(ing => {
            allIngredients.add(ing);
        });
    });
    
    // Hər ingredient üçün sətir əlavə et
    Array.from(allIngredients).sort().forEach(ingredient => {
        const unit = getIngredientUnit(ingredient);
        const price = config.unit_prices?.[ingredient] || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingredient}</td>
            <td>${unit}</td>
            <td>
                <input type="number" id="price_${ingredient}" 
                       value="${price}" step="0.001" min="0"
                       style="width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
            </td>
            <td>
                <button class="btn" onclick="updatePrice('${ingredient}')" 
                        style="background: #3498db; color: white; padding: 5px 10px;">
                    <i class="fas fa-save"></i>
                </button>
            </td>
        `;
        pricesList.appendChild(row);
    });
}

// Yardımçı funksiyalar
function getStatusColor(status) {
    const colors = {
        'Yeni': '#3498db',
        'Hazırlanır': '#f39c12',
        'Göndərildi': '#27ae60',
        'Ləğv edildi': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
}

function getIngredientUnit(ingredientName) {
    for (const cakeName in recipes) {
        const cake = recipes[cakeName];
        if (cake.ingredients && cake.ingredients[ingredientName]) {
            return cake.ingredients[ingredientName][0];
        }
    }
    return 'əd';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 
                          type === 'success' ? 'check-circle' : 
                          'info-circle'}"></i>
        ${message}
        <button onclick="this.parentElement.remove()" 
                style="float: right; background: none; border: none; color: inherit; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Cari tab-da alert göstər
    document.getElementById(currentTab).prepend(alertDiv);
    
    // 5 saniyədən sonra avtomatik sil
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Sifariş statusunu dəyiş
function changeOrderStatus(orderId, newStatus) {
    const orderIndex = orders.findIndex(o => o.id == orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        saveOrders();
        displayOrders();
        showAlert(`Sifariş #${orderId} statusu "${newStatus}" olaraq dəyişdirildi`, 'success');
    }
}

// Qiymətləri yenilə
function updatePrice(ingredient) {
    const priceInput = document.getElementById(`price_${ingredient}`);
    const newPrice = parseFloat(priceInput.value);
    
    if (!config.unit_prices) config.unit_prices = {};
    config.unit_prices[ingredient] = newPrice;
    
    showAlert(`${ingredient} qiyməti yeniləndi: ${newPrice.toFixed(3)} AZN`, 'success');
}

// Bütün qiymətləri saxla
async function savePrices() {
    const markupPercent = document.getElementById('markupPercent');
    config.markup_percent = parseFloat(markupPercent.value);
    
    try {
        // Müvəqqəti olaraq LocalStorage-a yaz (real tətbiqdə serverə göndərmək lazımdır)
        localStorage.setItem('tort_config', JSON.stringify(config));
        showAlert('Bütün qiymətlər və markup faizi yadda saxlanıldı', 'success');
    } catch (error) {
        showAlert('Yadda saxlanma xətası: ' + error.message, 'danger');
    }
}

// JSON fayllarını yenilə (simulyasiya)
async function saveOrders() {
    try {
        localStorage.setItem('tort_orders', JSON.stringify(orders));
    } catch (error) {
        console.error('Sifarişlər yadda saxlanmadı:', error);
    }
}

// Yeni tort əlavə et (modal)
function addNewCake() {
    alert('Yeni tort əlavə etmə funksiyası hazırlanma prosesindədir.\nPython versiyasından istifadə edin.');
}

// Inventory əməliyyatları
function addInventoryItem() {
    const itemName = prompt('Məhsul adını daxil edin:');
    if (!itemName) return;
    
    const unit = prompt('Ölçü vahidini daxil edin (əd, kg, g, ml):', 'əd');
    if (!unit) return;
    
    inventory[itemName] = {
        unit: unit,
        qty: 0,
        price: 0,
        min: 0
    };
    
    displayInventory();
    showAlert(`${itemName} anbara əlavə edildi`, 'success');
}

function editInventoryItem(itemName) {
    const item = inventory[itemName];
    if (!item) return;
    
    const newQty = prompt(`Yeni miqdar (cari: ${item.qty}):`, item.qty);
    if (newQty === null) return;
    
    const newPrice = prompt(`Yeni qiymət (cari: ${item.price}):`, item.price);
    if (newPrice === null) return;
    
    const newMin = prompt(`Yeni minimum səviyyə (cari: ${item.min}):`, item.min);
    if (newMin === null) return;
    
    inventory[itemName] = {
        ...item,
        qty: parseFloat(newQty),
        price: parseFloat(newPrice),
        min: parseFloat(newMin)
    };
    
    displayInventory();
    showAlert(`${itemName} məlumatları yeniləndi`, 'success');
}

function receiveInventory(itemName) {
    const amount = prompt(`${itemName} üçün qəbul miqdarını daxil edin:`);
    if (!amount) return;
    
    const item = inventory[itemName];
    if (item) {
        item.qty = (parseFloat(item.qty) || 0) + parseFloat(amount);
        displayInventory();
        showAlert(`${amount} ${item.unit || ''} ${itemName} anbara əlavə edildi`, 'success');
    }
}

function useInventory(itemName) {
    const amount = prompt(`${itemName} üçün istifadə miqdarını daxil edin:`);
    if (!amount) return;
    
    const item = inventory[itemName];
    if (item) {
        const currentQty = parseFloat(item.qty) || 0;
        const useAmount = parseFloat(amount);
        
        if (useAmount > currentQty) {
            alert('Anbarda kifayət qədər məhsul yoxdur!');
            return;
        }
        
        item.qty = currentQty - useAmount;
        displayInventory();
        showAlert(`${amount} ${item.unit || ''} ${itemName} anbardan istifadə edildi`, 'success');
    }
}

// Filtrləmə funksiyaları
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#ordersList tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('.status-badge');
        if (statusCell) {
            const status = statusCell.textContent;
            if (statusFilter === 'all' || status === statusFilter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Yeniləmə funksiyaları
function refreshRecipes() {
    loadAllData();
    showAlert('Tort reseptləri yeniləndi', 'success');
}

function refreshInventory() {
    displayInventory();
    showAlert('Anbar məlumatları yeniləndi', 'success');
}

// Event listener-ları qur
function setupEventListeners() {
    // Autosave on input change
    document.getElementById('markupPercent').addEventListener('change', function() {
        config.markup_percent = parseFloat(this.value);
    });
}