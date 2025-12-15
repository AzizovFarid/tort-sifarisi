// customer-script.js - Təkmilləşdirilmiş versiya (Unobtrusive JavaScript)

const DATA_KEY = 'tortSifarisiAdminData';
// Şəkillərinizin RAW URL ünvanı
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/AzizovFarid/tort-sifarisi/main/cake_images_v17/';

let customerAppData;
const KG_PER_PERSON = 0.2; // 1 nəfər üçün təxmini çəki

// --- Helper Funksiyalar ---

function loadCustomerData() {
    const storedData = localStorage.getItem(DATA_KEY);
    if (storedData) {
        customerAppData = JSON.parse(storedData);
    } else {
        // Məlumat yoxdursa, boş default data istifadə et
        customerAppData = { recipes: [], inventory: [], orders: [], config: { markupPercent: 0 } };
    }
}

/**
 * calculate_cost funksiyasını simulyasiya edir (1 kq üçün satış qiymətini hesablayır)
 */
function calculateCost(recipe) {
    let totalCost = 0;
    // Markup yoxdursa 0 istifadə et (və ya default 50)
    const markup = (customerAppData.config.markupPercent || 0) / 100;

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
    // loadCustomerData(); // Artıq DOMContentLoaded-da yüklənib
    const cakeSelect = document.getElementById('cakeSelect');  
    if (!cakeSelect) return;

    // Hal-hazırda seçilmiş dəyəri yadda saxla
    const selectedValue = cakeSelect.value;
    
    cakeSelect.innerHTML = '<option value="">Seçin...</option>';  
    
    // Qiymətləri Admin Panelindən yenidən hesablayır və reseptlərə əlavə edir
    customerAppData.recipes.forEach(recipe => {
        recipe.sale_price = calculateCost(recipe);
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

    // Əvvəlki seçimi bərpa et
    if (selectedValue && filteredRecipes.some(r => r.name === selectedValue)) {
        cakeSelect.value = selectedValue;
    } else if (filteredRecipes.length > 0) {
        // Əgər filter yoxdursa və boşdursa, birinci tortu seç
        if (!filter && !selectedValue) {
             cakeSelect.value = filteredRecipes[0].name;
        }
    }
    
    loadCakeDetails();
}

/**
 * Çəki, qiymət, nəfər sayı və tortun şəklini yeniləyir.
 */
function loadCakeDetails() {
    calculatePrice(); // Qiyməti və çəkini hesabla
    displayCakeImage(); // Şəkli göstər
}

function calculatePrice() {
    const cakeName = document.getElementById('cakeSelect').value;
    const weightInput = document.getElementById('weight');
    const weight = parseFloat(weightInput.value) || 0; // Çəki 0 da ola bilər (yoxlanılacaq)
    
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const finalPriceDisplay = document.getElementById('finalPrice');
    const prepTimeDisplay = document.getElementById('prepTime');

    if (recipe && weight > 0) {
        const baseSalePrice = recipe.sale_price || calculateCost(recipe); // Əgər populateCakeSelection-da hesablanmayıbsa
        const finalPrice = baseSalePrice * weight;

        finalPriceDisplay.textContent = `${finalPrice.toFixed(2)} AZN`;
        prepTimeDisplay.textContent = `Hazırlıq vaxtı: ${recipe.time}`;

        // Qiymət hesablanandan sonra nəfər sayını yenilə
        updatePersonCountFromWeight(weight);

    } else {
        finalPriceDisplay.textContent = '0.00 AZN';
        prepTimeDisplay.textContent = 'Hazırlıq vaxtı: -';
        document.getElementById('personCount').value = 0;
    }
    // Anbar xəbərdarlığını burada əlavə etmək üçün, anbar məlumatlarına ehtiyac var.
    // Təqdim olunan kodda "priceWarning" elementini göstərən bir məntiq yoxdur.
}

function displayCakeImage() {
    const cakeName = document.getElementById('cakeSelect').value;
    const recipe = customerAppData.recipes.find(r => r.name === cakeName);
    const imageContainer = document.getElementById('cakeImage');  
    const placeholder = document.getElementById('cakeImagePlaceholder');

    if (recipe && recipe.image_file && imageContainer && placeholder) {
        const imageUrl = IMAGE_BASE_URL + recipe.image_file;
        imageContainer.src = imageUrl;
        imageContainer.style.display = 'block';
        placeholder.style.display = 'none';
    } else if (imageContainer && placeholder) {
        imageContainer.src = '';
        imageContainer.style.display = 'none';
        placeholder.style.display = 'block';
    }
}


// --- Əlavə Funksiyalar ---

function filterCakes(event) {
    const filterValue = event.target.value;
    populateCakeSelection(filterValue);
}

function updateWeightFromPersons(event) {
    const personCount = parseFloat(event.target.value) || 0;
    const newWeight = (personCount * KG_PER_PERSON);
    
    document.getElementById('weight').value = newWeight.toFixed(1);
    calculatePrice();
}

function updatePersonCountFromWeight(weight) {
    if (weight > 0) {
        const personCount = Math.ceil(weight / KG_PER_PERSON);
        document.getElementById('personCount').value = personCount;
    }
}

function setTextColor(event) {
    const color = event.target.getAttribute('data-color');
    if (color) {
        document.getElementById('textColor').value = color;
        // Əlavə olaraq aktiv düyməni göstərmək üçün stil əlavə edilə bilər
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active-color'));
        event.target.classList.add('active-color');
    }
}

function switchTab(event) {
    const tabId = event.target.getAttribute('data-tab-target');
    if (!tabId) return;

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function setMinDeliveryDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Yanvar 0-dır!
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    
    document.getElementById('deliveryDate').setAttribute('min', minDate);
}


// --- Sifariş Vermə ---

function placeOrder(event) {
    event.preventDefault(); // Formun standart submit davranışını dayandır

    const orderForm = document.getElementById('orderForm');
    if (!orderForm.checkValidity()) {
        alert("Zəhmət olmasa bütün tələb olunan sahələri düzgün doldurun.");
        return;
    }

    const cake = document.getElementById('cakeSelect').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const date = document.getElementById('deliveryDate').value;
    const description = document.getElementById('orderDescription').value;
    const textColor = document.getElementById('textColor').value;
    const fontSize = document.getElementById('fontSize').value;
    
    const priceText = document.getElementById('finalPrice').textContent;
    const price = parseFloat(priceText.replace(' AZN', ''));
    
    if (price === 0 || isNaN(price)) {
        alert("Zəhmət olmasa tortu seçin və çəkini düzgün daxil edin.");
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
        description: description,
        textStyle: { color: textColor, size: fontSize }, // Əlavə olunan yazı stili məlumatı
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

    // Tort seçimlərini yenidən yükləyin
    populateCakeSelection();
    orderForm.reset(); // Sifariş tamamlandıqdan sonra formu sıfırla
}


// --- Sifariş İzləmə ---

function trackOrder(event) {
    event.preventDefault(); // Formun standart submit davranışını dayandır
    
    const trackOrderId = document.getElementById('trackOrderId').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    
    const orderId = parseInt(trackOrderId);

    if (isNaN(orderId) || orderId <= 0) {
        resultDiv.innerHTML = `<div class="alert alert-danger">Zəhmət olmasa düzgün Sifariş ID-si daxil edin.</div>`;
        return;
    }

    const order = (customerAppData.orders || []).find(o => o.id === orderId);

    if (order) {
        const statusClass = order.status === 'Yeni' ? 'alert-info' : 
                            order.status === 'Hazırlanır' ? 'alert-warning' : 
                            order.status === 'Göndərildi' ? 'alert-success' : 'alert-danger';
                                    
        resultDiv.innerHTML = `
            <div class="alert ${statusClass}">
                <h4>Sifariş ID: ${order.id}</h4>
                <p>Status: <b>${order.status}</b></p>
                <p>Müştəri: ${order.customer} | Telefon: ${order.phone}</p>
                <p>Tort: ${order.cake} (${order.weight} kg)</p>
                <p>Qiymət: ${order.price.toFixed(2)} AZN</p>
                <p>Tarix: ${order.date}</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `<div class="alert alert-danger">Belə bir Sifariş ID-si tapılmadı.</div>`;
    }
}


// --- Başlanğıc və Event Listener-lərin Birləşdirilməsi ---

document.addEventListener('DOMContentLoaded', () => {
    loadCustomerData();
    setMinDeliveryDate();

    // Sifariş Formu Eventləri
    const cakeSelect = document.getElementById('cakeSelect');
    const weightInput = document.getElementById('weight');
    const personCountInput = document.getElementById('personCount');
    const searchCakeInput = document.getElementById('searchCake');
    const orderForm = document.getElementById('orderForm');

    // Məzmun yükləndikdən sonra seçimləri doldur
    populateCakeSelection();

    // Event Listener-lərin bağlanması
    cakeSelect.addEventListener('change', loadCakeDetails);
    weightInput.addEventListener('input', calculatePrice); // İnput zamanı yenilə
    personCountInput.addEventListener('input', updateWeightFromPersons);
    searchCakeInput.addEventListener('keyup', filterCakes);
    orderForm.addEventListener('submit', placeOrder);

    // Yazı rəngi seçimi
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', setTextColor);
    });

    // İlk rəngin aktivləşdirilməsi (default qara)
    const defaultColorButton = document.querySelector('.color-btn[data-color="#000000"]');
    if(defaultColorButton) {
        defaultColorButton.classList.add('active-color');
    }

    // Tab dəyişdirmə
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    // İzləmə Formu Eventi
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        trackingForm.addEventListener('submit', trackOrder);
    }
});
