// Global dəyişənlər
let cakes = {};
let config = {};
let currentTextColor = '#000000';

// Səhifə yükləndikdə
document.addEventListener('DOMContentLoaded', function() {
    loadCakes();
    setupDateInput();
    setupEventListeners();
});

// Tortları yüklə
async function loadCakes() {
    try {
        const response = await fetch('data/recipes_v17.json');
        cakes = await response.json();
        
        const configResponse = await fetch('data/config_v19.json');
        config = await configResponse.json();
        
        populateCakeList();
        calculatePrice();
    } catch (error) {
        console.error('Məlumat yüklənmə xətası:', error);
        showMessage('Məlumat yüklənmə xətası. Zəhmət olmasa, admindən kömək istəyin.', 'danger');
    }
}

// Tort siyahısını doldur
function populateCakeList() {
    const select = document.getElementById('cakeSelect');
    select.innerHTML = '<option value="">Seçin...</option>';
    
    Object.keys(cakes).forEach(cakeName => {
        if (cakeName === 'Xeta') return;
        
        const option = document.createElement('option');
        option.value = cakeName;
        option.textContent = cakeName;
        select.appendChild(option);
    });
}

// Tort məlumatlarını yüklə
function loadCakeDetails() {
    const cakeName = document.getElementById('cakeSelect').value;
    if (!cakeName || !cakes[cakeName]) return;
    
    const cake = cakes[cakeName];
    
    // Hazırlıq vaxtını göstər
    document.getElementById('prepTime').textContent = `Hazırlıq vaxtı: ${cake.prep_time || '120 dəq'}`;
    
    // Şəkli göstər
    const imageContainer = document.getElementById('cakeImage');
    const placeholder = document.getElementById('cakeImagePlaceholder');
    
    if (cake.images && Object.keys(cake.images).length > 0) {
        // İlk şəkli tap
        const firstImageKey = Object.keys(cake.images)[0];
        const imagePath = `cake_images_v17/${cake.images[firstImageKey]}`;
        
        imageContainer.src = imagePath;
        imageContainer.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Şəklin yüklənməsini yoxla
        imageContainer.onerror = function() {
            imageContainer.style.display = 'none';
            placeholder.style.display = 'block';
            placeholder.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #f39c12; font-size: 48px;"></i>
                <p>Şəkil yüklənə bilmədi</p>
            `;
        };
    } else {
        imageContainer.style.display = 'none';
        placeholder.style.display = 'block';
    }
    
    // Qiyməti hesabla
    calculatePrice();
}

// Qiyməti hesabla
function calculatePrice() {
    const cakeName = document.getElementById('cakeSelect').value;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    
    if (!cakeName || !cakes[cakeName] || weight <= 0) {
        document.getElementById('finalPrice').textContent = '0.00 AZN';
        document.getElementById('priceWarning').style.display = 'none';
        return;
    }
    
    const cake = cakes[cakeName];
    const ingredients = cake.ingredients || {};
    const markup = (config.markup_percent || 50) / 100;
    let totalCost = 0;
    
    // Hər ingredientin dəyərini hesabla
    Object.keys(ingredients).forEach(ingredient => {
        const [unit, baseQty] = ingredients[ingredient];
        const neededQty = baseQty * weight;
        const unitPrice = config.unit_prices?.[ingredient] || 0;
        totalCost += neededQty * unitPrice;
    });
    
    // Satış qiyməti
    const salePrice = totalCost * (1 + markup);
    document.getElementById('finalPrice').textContent = `${salePrice.toFixed(2)} AZN`;
    
    // Anbar kontrolu
    checkInventory(cakeName, weight);
}

// Anbar kontrolu
async function checkInventory(cakeName, weight) {
    try {
        const invResponse = await fetch('data/inventory_v1.json');
        const inventory = await invResponse.json();
        
        const cake = cakes[cakeName];
        const ingredients = cake.ingredients || {};
        let hasShortage = false;
        
        for (const [ingredient, [unit, baseQty]] of Object.entries(ingredients)) {
            const needed = baseQty * weight;
            const stock = inventory[ingredient]?.qty || 0;
            
            if (needed > stock) {
                hasShortage = true;
                break;
            }
        }
        
        const warningElement = document.getElementById('priceWarning');
        if (hasShortage) {
            warningElement.style.display = 'block';
            warningElement.innerHTML = '⚠️ Anbarda çatışmazlıq var (adminlə əlaqə saxlayın)';
        } else {
            warningElement.style.display = 'none';
        }
    } catch (error) {
        console.error('Anbar kontrolu xətası:', error);
    }
}

// Nəfər sayına görə çəkini yenilə
function updateWeightFromPersons() {
    const personCount = parseInt(document.getElementById('personCount').value) || 1;
    const weight = personCount * 0.2; // 1 nəfər = 0.2 kg
    
    document.getElementById('weight').value = weight.toFixed(1);
    calculatePrice();
}

// Sifariş yerləşdir
async function placeOrder() {
    // Məlumatları yoxla
    const cakeName = document.getElementById('cakeSelect').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const description = document.getElementById('orderDescription').value;
    const personCount = parseInt(document.getElementById('personCount').value);
    const fontSize = parseInt(document.getElementById('fontSize').value);
    
    // Validasiya
    if (!cakeName) {
        showMessage('Zəhmət olmasa tort seçin.', 'danger');
        return;
    }
    
    if (!customerName || !customerPhone || !deliveryDate) {
        showMessage('Ad, Telefon və Tarix sahələrini doldurun.', 'danger');
        return;
    }
    
    if (weight <= 0) {
        showMessage('Çəki düzgün deyil.', 'danger');
        return;
    }
    
    // Tarix validasiyası
    const today = new Date().toISOString().split('T')[0];
    if (deliveryDate < today) {
        showMessage('Çatdırılma tarixi keçmiş ola bilməz.', 'danger');
        return;
    }
    
    // Qiyməti hesabla
    const priceText = document.getElementById('finalPrice').textContent;
    const price = parseFloat(priceText) || 0;
    
    // Sifariş yarat
    const order = {
        id: Date.now(), // Unikal ID
        order_date: today,
        customer_name: customerName,
        customer_phone: customerPhone,
        cake_name: cakeName,
        weight: weight,
        sale_price: price,
        delivery_date: deliveryDate,
        person_count: personCount,
        order_description: description,
        text_color: currentTextColor,
        text_font_size: fontSize,
        status: 'Yeni',
        inventory_warning: document.getElementById('priceWarning').style.display !== 'none'
    };
    
    try {
        // Köhnə sifarişləri yüklə
        const ordersResponse = await fetch('data/orders_v19.json');
        let orders = await ordersResponse.json();
        
        // Yeni sifariş əlavə et
        orders.push(order);
        
        // LocalStorage-a yaz (müvəqqəti həll)
        localStorage.setItem('tort_orders', JSON.stringify(orders));
        
        // Uğur mesajı
        const resultDiv = document.getElementById('orderResult');
        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <h4><i class="fas fa-check-circle"></i> Sifariş Uğurla Yerləşdirildi!</h4>
                <p><strong>Sifariş ID:</strong> #${order.id}</p>
                <p><strong>Tort:</strong> ${cakeName} (${weight} kg)</p>
                <p><strong>Qiymət:</strong> ${price.toFixed(2)} AZN</p>
                <p><strong>Çatdırılma:</strong> ${deliveryDate}</p>
                <p>Sifarişinizi izləmək üçün Sifariş İzlə bölməsinə keçin.</p>
            </div>
        `;
        
        // Formu təmizlə (istəyə bağlı)
        // document.getElementById('customerName').value = '';
        // document.getElementById('customerPhone').value = '';
        // document.getElementById('orderDescription').value = '';
        
        showMessage('Sifarişiniz uğurla yerləşdirildi!', 'success');
        
    } catch (error) {
        console.error('Sifariş xətası:', error);
        showMessage('Sifariş zamanı xəta baş verdi. Zəhmət olmasa, admindən kömək istəyin.', 'danger');
    }
}

// Sifariş izlə
async function trackOrder() {
    const orderId = document.getElementById('trackOrderId').value;
    
    if (!orderId) {
        showMessage('Sifariş ID daxil edin.', 'warning');
        return;
    }
    
    try {
        const ordersResponse = await fetch('data/orders_v19.json');
        const orders = await ordersResponse.json();
        
        const order = orders.find(o => o.id == orderId);
        
        const resultDiv = document.getElementById('trackingResult');
        
        if (order) {
            const statusColors = {
                'Yeni': '#3498db',
                'Hazırlanır': '#f39c12',
                'Göndərildi': '#27ae60',
                'Ləğv edildi': '#e74c3c'
            };
            
            const statusColor = statusColors[order.status] || '#95a5a6';
            
            resultDiv.innerHTML = `
                <div class="alert alert-info">
                    <h4><i class="fas fa-clipboard-check"></i> Sifariş Məlumatları</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <div>
                            <p><strong>Sifariş ID:</strong> #${order.id}</p>
                            <p><strong>Müştəri:</strong> ${order.customer_name}</p>
                            <p><strong>Telefon:</strong> ${order.customer_phone}</p>
                            <p><strong>Tort:</strong> ${order.cake_name}</p>
                        </div>
                        <div>
                            <p><strong>Çəki:</strong> ${order.weight} kg</p>
                            <p><strong>Nəfər:</strong> ${order.person_count}</p>
                            <p><strong>Qiymət:</strong> ${order.sale_price} AZN</p>
                            <p><strong>Status:</strong> 
                                <span style="background: ${statusColor}; color: white; padding: 3px 10px; border-radius: 20px;">
                                    ${order.status}
                                </span>
                            </p>
                        </div>
                    </div>
                    <p style="margin-top: 10px;"><strong>Açıqlama:</strong> ${order.order_description || 'Yox'}</p>
                    <p><strong>Çatdırılma:</strong> ${order.delivery_date}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    #${orderId} ID-li sifariş tapılmadı.
                </div>
            `;
        }
    } catch (error) {
        console.error('Sifariş izləmə xətası:', error);
        showMessage('Sifariş izləmə zamanı xəta baş verdi.', 'danger');
    }
}

// Yardımçı funksiyalar
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
}

function filterCakes() {
    const searchText = document.getElementById('searchCake').value.toLowerCase();
    const select = document.getElementById('cakeSelect');
    const options = select.getElementsByTagName('option');
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const text = option.textContent.toLowerCase();
        
        if (searchText === '' || text.includes(searchText)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    }
}

function setTextColor(color) {
    currentTextColor = color;
    // Preview üçün (istəyə bağlı)
    document.getElementById('orderDescription').style.color = color;
}

function setupDateInput() {
    // Bugünün tarixini minimum tarix kimi təyin et
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').min = today;
    
    // Default olaraq 3 gün sonranı təyin et
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const defaultDate = threeDaysLater.toISOString().split('T')[0];
    document.getElementById('deliveryDate').value = defaultDate;
}

function showMessage(message, type = 'info') {
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
    
    document.getElementById('order').prepend(alertDiv);
    
    // 5 saniyədən sonra avtomatik sil
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

function setupEventListeners() {
    // Çəki dəyişdikdə nəfər sayını yenilə
    document.getElementById('weight').addEventListener('input', function() {
        const weight = parseFloat(this.value) || 0;
        const personCount = Math.max(1, Math.round(weight / 0.2));
        document.getElementById('personCount').value = personCount;
        calculatePrice();
    });
    
    // Nəfər sayı dəyişdikdə çəkini yenilə
    document.getElementById('personCount').addEventListener('input', updateWeightFromPersons);
    
    // Yazı rəngi preview
    document.getElementById('orderDescription').addEventListener('input', function() {
        this.style.color = currentTextColor;
        this.style.fontSize = document.getElementById('fontSize').value + 'px';
    });
    
    // Font ölçüsü dəyişdikdə
    document.getElementById('fontSize').addEventListener('change', function() {
        document.getElementById('orderDescription').style.fontSize = this.value + 'px';
    });
}