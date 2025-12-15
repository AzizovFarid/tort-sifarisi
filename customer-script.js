// customer-script.js - Müştəri görünüşü üçün əsas məntiq

// Local Storage açarı admin skripti ilə eyni olmalıdır!
const DATA_KEY = 'tortSifarisiAdminData';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/cake_images_v17/';

let customerAppData;

function loadCustomerData() {
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        customerAppData = JSON.parse(storedData);
    } else {
        // Məlumat yoxdursa adminin yaratdığı default datanı yüklə
        alert("Xəta: Admin məlumat bazası mövcud deyil!");
        customerAppData = { recipes: [], config: { markupPercent: 0 } };
    }
}

// Admin skriptindəki calculateCost funksiyasının eynisi
function calculateCost(recipe) {
    let totalCost = 0;
    const markup = customerAppData.config.markupPercent / 100;

    recipe.ingredients.forEach(ing => {
        const item = customerAppData.inventory.find(i => i.name === ing.name);
        if (item) {
            totalCost += ing.amount * item.price;
        }
    });

    const salePrice = totalCost * (1 + markup);
    return salePrice;
}


// --- Müştəri İnterfeysini Doldurma ---

function populateCakeSelection() {
    loadCustomerData();
    const cakeSelect = document.getElementById('cakeName'); // customer.html-də olmalıdır
    if (!cakeSelect) return;

    // Seçim sahəsini təmizlə
    cakeSelect.innerHTML = '<option value="">--- Tort Seçin ---</option>'; 
    customerAppData.recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = recipe.name;
        cakeSelect.appendChild(option);
    });

    // İlk tortu seçin və qiyməti hesablayın
    if(customerAppData.recipes.length > 0) {
        cakeSelect.value = customerAppData.recipes[0].name;
        updateCakeDetails();
    }
}

function updateCakeDetails() {
    const cakeName = document.getElementById('cakeName').value;
    const weight = parseFloat(document.getElementById('weight').value) || 1;
    
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const priceDisplay = document.getElementById('priceDisplay'); // customer.html-də olmalıdır
    const imageContainer = document.getElementById('cakeImage'); // customer.html-də olmalıdır

    if (recipe) {
        const baseSalePrice = calculateCost(recipe); // 1 kg üçün qiymət (fərz edək)
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

    const newOrderId = Math.max(...customerAppData.orders.map(o => o.id)) + 1 || 1;

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
    localStorage.setItem(DATA_KEY, JSON.stringify(customerAppData)); // Yadda Saxla!

    alert(`✅ Sifarişiniz uğurla yerləşdirildi! Sifariş ID: ${newOrderId}\nQiymət: ${price.toFixed(2)} AZN`);

    // Sifariş verildikdən sonra Admin Panelində görünəcək.
    document.getElementById('orderForm').reset();
    updateCakeDetails();
}

// Başlanğıc
document.addEventListener('DOMContentLoaded', populateCakeSelection);
