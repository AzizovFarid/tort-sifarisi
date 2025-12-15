// customer-script.js - Müştəri görünüşü üçün əsas məntiq
const DATA_KEY = 'tortSifarisiAdminData';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/cake_images_v17/';

let customerAppData;

function loadCustomerData() {
    // Admin skriptində Local Storage-a yadda saxlanılan datanı yüklə
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        customerAppData = JSON.parse(storedData);
    } else {
        // Əgər admin hələ heç nəyi Local Storage-ə saxlamayıbsa, xəbərdarlıq et
        customerAppData = { recipes: [], inventory: [], orders: [], config: { markupPercent: 0 } };
        document.getElementById('priceDisplay').textContent = "Məlumat bazası yoxdur. Admin Panelini yoxlayın.";
    }
}

/**
 * calculate_cost funksiyası (Admin Panelindən eyni məntiq)
 */
function calculateCost(recipe) {
    let totalCost = 0;
    const markup = customerAppData.config.markupPercent / 100;

    const inventoryMap = customerAppData.inventory.reduce((acc, item) => {
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
    return salePrice;
}


// --- Müştəri İnterfeysini Doldurma ---

function populateCakeSelection() {
    loadCustomerData();
    const cakeSelect = document.getElementById('cakeName'); 
    if (!cakeSelect) return;

    cakeSelect.innerHTML = '<option value="">--- Tort Seçin ---</option>'; 
    customerAppData.recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        // Əgər qiymət hesablanıbsa göstər
        option.textContent = `${recipe.name} (${recipe.sale_price ? recipe.sale_price.toFixed(2) + ' AZN/kq' : 'Qiymət yoxdur'})`;
        cakeSelect.appendChild(option);
    });

    if(customerAppData.recipes.length > 0) {
        // İlk elementi seçib detalları yüklə
        document.getElementById('weight').value = 1.0; 
        updateCakeDetails();
    }
}

function updateCakeDetails() {
    const cakeName = document.getElementById('cakeName').value;
    const weightInput = document.getElementById('weight');
    const weight = parseFloat(weightInput.value) || 1;
    
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const priceDisplay = document.getElementById('priceDisplay');
    const imageContainer = document.getElementById('cakeImage');

    if (recipe) {
        const baseSalePrice = calculateCost(recipe); 
        const finalPrice = baseSalePrice * weight;

        priceDisplay.textContent = `${finalPrice.toFixed(2)} AZN`;
        
        // Şəkli göstər
        if (recipe.image_file && imageContainer) {
            imageContainer.src = IMAGE_BASE_URL + recipe.image_file;
            imageContainer.style.display = 'block';
        }

    } else {
        priceDisplay.textContent = '0.00 AZN';
        if (imageContainer) imageContainer.style.display = 'none';
    }
}

// --- Sifariş Yaratma Funksiyası (create_order) ---

function submitOrder() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const cake = document.getElementById('cakeName').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const date = document.getElementById('deliveryDate').value || new Date().toISOString().slice(0, 10);
    const priceText = document.getElementById('priceDisplay').textContent;
    const price = parseFloat(priceText.replace(' AZN', ''));

    if (!name || !phone || !cake || !weight || isNaN(price) || price === 0) {
        alert("Zəhmət olmasa bütün sahələri doldurun və tortu seçin.");
        return;
    }

    const currentOrders = customerAppData.orders || [];
    const newOrderId = currentOrders.length > 0 ? Math.max(...currentOrders.map(o => o.id)) + 1 : 1;

    const newOrder = {
        id: newOrderId,
        customer: name,
        phone: phone,
        cake: cake,
        weight: weight,
        price: price,
        date: date,
        status: "Yeni"
    };

    customerAppData.orders.push(newOrder);
    localStorage.setItem(DATA_KEY, JSON.stringify(customerAppData)); 

    alert(`✅ Sifarişiniz uğurla yerləşdirildi! Sifariş ID: ${newOrderId}\nQiymət: ${price.toFixed(2)} AZN`);

    // Formu sıfırla
    document.getElementById('orderForm').reset(); // customer.html-də form ID-si `orderForm` olmalıdır
    populateCakeSelection();
}

// Başlanğıc
document.addEventListener('DOMContentLoaded', () => {
    loadCustomerData();
    populateCakeSelection();
});
