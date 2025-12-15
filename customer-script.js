// customer-script.js - İŞLƏYƏN VERSİYA
console.log("Customer script işləyir!");

let cakesData = {};
let configData = {};

async function loadInitialData() {
    try {
        // Reseptleri yükle
        const recipesRes = await fetch('data/recipes_v17.json');
        cakesData = await recipesRes.json();
        
        // Config yükle
        const configRes = await fetch('data/config_v19.json');
        configData = await configRes.json();
        
        populateCakeDropdown();
    } catch (error) {
        console.error("Data yükleme xətası:", error);
        document.getElementById("cakeSelect").innerHTML = 
            '<option value="">Xəta: Data yüklənə bilmədi</option>';
    }
}

function populateCakeDropdown() {
    const select = document.getElementById("cakeSelect");
    select.innerHTML = '<option value="">Seçin...</option>';
    
    for (const cakeName in cakesData) {
        if (cakeName === "Xeta") continue;
        
        const option = document.createElement("option");
        option.value = cakeName;
        option.textContent = cakeName;
        select.appendChild(option);
    }
}

function calculatePrice() {
    const cakeName = document.getElementById("cakeSelect").value;
    const weight = parseFloat(document.getElementById("weight").value) || 0;
    
    if (!cakeName || !cakesData[cakeName]) {
        document.getElementById("finalPrice").textContent = "0.00 AZN";
        document.getElementById("prepTime").textContent = "Hazırlıq vaxtı: -";
        return;
    }
    
    const cake = cakesData[cakeName];
    document.getElementById("prepTime").textContent = `Hazırlıq vaxtı: ${cake.prep_time || "120 dəq"}`;
    
    // Qiymet hesabla
    let totalCost = 0;
    const markup = (configData.markup_percent || 50) / 100;
    
    for (const [ingredient, [unit, qty]] of Object.entries(cake.ingredients || {})) {
        const unitPrice = configData.unit_prices?.[ingredient] || 0;
        const neededQty = qty * weight;
        totalCost += neededQty * unitPrice;
    }
    
    const salePrice = totalCost * (1 + markup);
    document.getElementById("finalPrice").textContent = `${salePrice.toFixed(2)} AZN`;
}

// Event listener-lar
document.addEventListener("DOMContentLoaded", function() {
    console.log("Customer DOM hazır!");
    loadInitialData();
    
    // Tort seçimi deyişende
    document.getElementById("cakeSelect").addEventListener("change", calculatePrice);
    
    // Çeki deyişende
    document.getElementById("weight").addEventListener("input", calculatePrice);
    
    // Nəfər sayı deyişende çekini yenile
    document.getElementById("personCount").addEventListener("input", function() {
        const persons = parseInt(this.value) || 1;
        const weight = persons * 0.2; // 1 nəfər = 0.2 kg
        document.getElementById("weight").value = weight.toFixed(1);
        calculatePrice();
    });
    
    // Bugünün tarixini set et
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("deliveryDate").min = today;
    
    // 3 gün sonra default
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    document.getElementById("deliveryDate").value = futureDate.toISOString().split('T')[0];
});
