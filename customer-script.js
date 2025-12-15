// customer-script.js - Sizin HTML ID-lərinizə uyğunlaşdırılmış və Şəkillərlə tam funksional kod

const DATA_KEY = 'tortSifarisiAdminData';
// Şəkillərinizin RAW URL ünvanı
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/cake_images_v17/';

let customerAppData;

// --- Helper Funksiyalar ---

function loadCustomerData() {
    // Local Storage-dan məlumat bazasını yükləyir (Admin panelinin yadda saxladığı məlumatı)
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        customerAppData = JSON.parse(storedData);
    } else {
        // Məlumat yoxdursa, boş default data istifadə et
        customerAppData = { recipes: [], inventory: [], orders: [], config: { markupPercent: 0 } };
        document.getElementById('finalPrice').textContent = "0.00 AZN (Məlumat yoxdur)";
    }
}

/**
 * calculate_cost funksiyasını simulyasiya edir (1 kq üçün satış qiymətini hesablayır)
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


// --- İnterfeys Məlumatlarını Yükləmə ---

function populateCakeSelection(filter = '') {
    loadCustomerData();
    const cakeSelect = document.getElementById('cakeSelect'); 
    if (!cakeSelect) return;

    // Hal-hazırda seçilmiş dəyəri yadda saxla
    const selectedValue = cakeSelect.value;
    
    cakeSelect.innerHTML = '<option value="">Seçin...</option>'; 
    
    // Qiymətləri Admin Panelindən yenidən hesablayır
    customerAppData.recipes.forEach(recipe => {
        const baseSalePrice = calculateCost(recipe);
        recipe.sale_price = baseSalePrice;
    });

    // Axtarış filtri
    const filteredRecipes = customerAppData.recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(filter.toLowerCase())
    );

    filteredRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = `${recipe.name} (${recipe.sale_price.toFixed(2)} AZN/kq)`;
        cakeSelect.appendChild(option);
    });

    // Əvvəlki seçimi bərpa et (və ya ilk tortu seç)
    if (selectedValue && filteredRecipes.some(r => r.name === selectedValue)) {
        cakeSelect.value = selectedValue;
    } else if (filteredRecipes.length > 0 && !filter) {
        cakeSelect.value = filteredRecipes[0].name;
    }
    
    // Tort seçimi dəyişdikdən sonra detalları yüklə
    loadCakeDetails();
}

/**
 * Çəki və qiyməti hesablayır, tortun şəklini göstərir.
 * Sizin HTML-dəki 'onchange="loadCakeDetails()"' əvəzinə 'onchange="calculatePrice()"' və ya başqa ad verilsə də,
 * mən bütün məntiqi buraya yerləşdirirəm.
 */
function loadCakeDetails() {
    calculatePrice(); // Qiyməti və çəkini hesabla
    displayCakeImage(); // Şəkli göstər
}

function calculatePrice() {
    const cakeName = document.getElementById('cakeSelect').value;
    const weightInput = document.getElementById('weight');
    const weight = parseFloat(weightInput.value) || 1;
    
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const finalPriceDisplay = document.getElementById('finalPrice'); // HTML-dəki ID
    const prepTimeDisplay = document.getElementById('prepTime');

    if (recipe) {
        const baseSalePrice = calculateCost(recipe); 
        const finalPrice = baseSalePrice * weight;

        finalPriceDisplay.textContent = `${finalPrice.toFixed(2)} AZN`;
        prepTimeDisplay.textContent = `Hazırlıq vaxtı: ${recipe.time}`;

        // Qiymət hesablanandan sonra nəfər sayını yenilə (əgər çəki dəyişibsə)
        updatePersonCountFromWeight(weight);

    } else {
        finalPriceDisplay.textContent = '0.00 AZN';
        prepTimeDisplay.textContent = 'Hazırlıq vaxtı: -';
    }
}

function displayCakeImage() {
    const cakeName = document.getElementById('cakeSelect').value;
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const imageContainer = document.getElementById('cakeImage'); 
    const placeholder = document.getElementById('cakeImagePlaceholder');

    if (recipe && recipe.image_file && imageContainer && placeholder) {
        // Şəkil URL-nin düzgün olduğunu bir daha yoxlayırıq
        const imageUrl = IMAGE_BASE_URL + recipe.image_file;
        imageContainer.src = imageUrl;
        imageContainer.style.display = 'block';
        placeholder.style.display = 'none'; // Placeholder-i gizlət
        
        // Bu hissə DEBUG üçündür, lakin şəkil gəlməsə, konsolu yoxlayın.
        console.log("Şəkil yüklənir:", imageUrl); 
    } else if (imageContainer && placeholder) {
        imageContainer.src = '';
        imageContainer.style.display = 'none';
        placeholder.style.display = 'block'; // Placeholder-i göstər
    }
}


// --- Əlavə Funksiyalar (Sizin HTML-dən gəlir) ---

function filterCakes() {
    const filterValue = document.getElementById('searchCake').value;
    populateCakeSelection(filterValue);
}

function updateWeightFromPersons() {
    const KG_PER_PERSON = 0.2;
    const personCount = parseFloat(document.getElementById('personCount').value) || 0;
    const newWeight = (personCount * KG_PER_PERSON).toFixed(1);
    
    document.getElementById('weight').value = newWeight;
    calculatePrice();
}

function updatePersonCountFromWeight(weight) {
    const KG_PER_PERSON = 0.2;
    if (weight > 0) {
        const personCount = Math.ceil(weight / KG_PER_PERSON);
        document.getElementById('personCount').value = personCount;
    }
}

// Sadəcə xəbərdarlıq edən stub funksiyaları (daha kompleks məntiq tələb etmirsinizsə)
function setTextColor(color) {
    alert(`Yazı rəngi: ${color} seçildi. Bu funksiya yalnız sifariş açıqlamasında yadda saxlanılacaq.`);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tabs button[onclick*="${tabId}"]`).classList.add('active');
    // İzləmə tabına keçəndə heç nə yükləmirik
}

function trackOrder() {
    const orderId = parseInt(document.getElementById('trackOrderId').value);
    const resultDiv = document.getElementById('trackingResult');
    
    if (isNaN(orderId) || orderId <= 0) {
        resultDiv.innerHTML = `<div class="alert alert-danger">Zəhmət olmasa düzgün Sifariş ID-si daxil edin.</div>`;
        return;
    }

    const order = customerAppData.orders.find(o => o.id === orderId);

    if (order) {
        const statusClass = order.status === 'Yeni' ? 'alert-info' : 
                            order.status === 'Hazırlanır' ? 'alert-warning' : 
                            order.status === 'Göndərildi' ? 'alert-success' : 'alert-danger';
                            
        resultDiv.innerHTML = `
            <div class="alert ${statusClass}">
                <h4>Sifariş ID: ${order.id}</h4>
                <p>Status: <b>${order.status}</b></p>
                <p>Tort: ${order.cake} (${order.weight} kg)</p>
                <p>Qiymət: ${order.price.toFixed(2)} AZN</p>
                <p>Tarix: ${order.date}</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `<div class="alert alert-danger">Belə bir Sifariş ID-si tapılmadı.</div>`;
    }
}


// --- Sifariş Vermə ---

function placeOrder() {
    const cake = document.getElementById('cakeSelect').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const date = document.getElementById('deliveryDate').value;
    
    const priceText = document.getElementById('finalPrice').textContent;
    const price = parseFloat(priceText.replace(' AZN', ''));
    
    if (!cake || !weight || !name || !phone || !date || isNaN(price) || price === 0) {
        alert("Zəhmət olmasa bütün tələb olunan sahələri doldurun (Tortu seçin, Çəki, Ad, Telefon, Tarix).");
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

    document.getElementById('orderResult').innerHTML = `
        <div class="alert alert-success">
            ✅ Sifarişiniz uğurla yerləşdirildi! Sifariş ID: <b>${newOrderId}</b>.<br>
            Yekun Qiymət: ${price.toFixed(2)} AZN.
        </div>
    `;

    // Formu sıfırla (Lazım olarsa)
    // document.getElementById('order').querySelector('form').reset();
    
    // Tort seçimlərini yenidən yükləyin (status dəyişmədiyi üçün lazımlı deyil, amma yerində qalsın)
    populateCakeSelection();
}


// --- Başlanğıc ---

document.addEventListener('DOMContentLoaded', () => {
    // İlkin Local Storage-dən məlumatı yüklə
    loadCustomerData();
    // Tort seçimlərini və qiymətlərini doldur
    populateCakeSelection();
});
