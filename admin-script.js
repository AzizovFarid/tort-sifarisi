// admin-script.js - İŞLƏYƏN VERSİYA
console.log("Admin script işləyir!");

// Basit data yükleme
async function loadData() {
    try {
        const response = await fetch('data/recipes_v17.json');
        const recipes = await response.json();
        console.log("Reseptler yüklendi:", recipes);
        
        // Tortları goster
        displayRecipes(recipes);
    } catch (error) {
        console.error("Xəta:", error);
        document.getElementById("recipesList").innerHTML = 
            '<tr><td colspan="4">Xəta: Data yüklənə bilmədi</td></tr>';
    }
}

function displayRecipes(recipes) {
    const tbody = document.getElementById("recipesList");
    tbody.innerHTML = '';
    
    for (const [name, data] of Object.entries(recipes)) {
        if (name === "Xeta") continue;
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${name}</strong></td>
            <td>${data.prep_time || "120 dəq"}</td>
            <td>${Object.keys(data.ingredients || {}).join(", ")}</td>
            <td>
                <button style="background:#3498db;color:white;border:none;padding:5px 10px;border-radius:3px;margin:2px;">
                    Redaktə
                </button>
                <button style="background:#e74c3c;color:white;border:none;padding:5px 10px;border-radius:3px;margin:2px;">
                    Sil
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM hazır!");
    loadData();
    
    // Tab değiştirme
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", function() {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            this.classList.add("active");
            const tabId = this.getAttribute("onclick").match(/'([^']+)'/)[1];
            document.getElementById(tabId).classList.add("active");
        });
    });
});
