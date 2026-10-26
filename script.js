// =====================================================
// PRODUCT INVENTORY MANAGEMENT SYSTEM (multi-page)
// =====================================================

// ---------------- AUTH GUARD ----------------
// Runs on every protected page. If not logged in, bounce to login.html.
(function authGuard() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const onLoginPage = location.pathname.split("/").pop() === "login.html";

  if (!isLoggedIn && !onLoginPage) {
    location.href = "login.html";
  }
})();

// ---------------- LOGOUT ----------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      location.href = "login.html";
    });
  }
});

let products = JSON.parse(localStorage.getItem("inventoryProducts")) || [];

const suppliers = [
  { name: "ABC Electronics", phone: "+91 9876543210", email: "abc@gmail.com", city: "Chennai" },
  { name: "Tech World", phone: "+91 9876501234", email: "techworld@gmail.com", city: "Coimbatore" },
  { name: "Office Supplies", phone: "+91 9876512345", email: "office@gmail.com", city: "Tiruppur" }
];

function saveProducts() {
  localStorage.setItem("inventoryProducts", JSON.stringify(products));
}

function generateId() {
  return "P" + String(Date.now()).slice(-5);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getStatus(product) {
  if (product.quantity === 0) return "out";
  if (product.quantity <= product.minimumStock) return "low";
  return "in";
}

function getStatusBadge(product) {
  const status = getStatus(product);
  if (status === "out") return `<span class="status out-stock">Out of Stock</span>`;
  if (status === "low") return `<span class="status low-stock">Low Stock</span>`;
  return `<span class="status in-stock">In Stock</span>`;
}

// ---------------- ACTIVE NAV HIGHLIGHT ----------------
(function highlightActiveNav() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-btn").forEach(link => {
    const href = link.getAttribute("href");
    if (href === page) link.classList.add("active");
    else link.classList.remove("active");
  });
})();

// ---------------- CURRENT DATE (any page) ----------------
(function showDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const today = new Date();
  el.textContent = today.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
})();

// =====================================================
// DASHBOARD PAGE (index.html)
// =====================================================
if (document.getElementById("totalProducts")) {

  function updateDashboard() {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minimumStock).length;
    const outStock = products.filter(p => p.quantity === 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    document.getElementById("totalProducts").textContent = totalProducts;
    document.getElementById("totalStock").textContent = totalStock;
    document.getElementById("lowStock").textContent = lowStock;
    document.getElementById("outStock").textContent = outStock;
    document.getElementById("inventoryValue").textContent = "₹" + inventoryValue.toLocaleString("en-IN");

    displayLowStock();
  }

  function displayLowStock() {
    const table = document.getElementById("lowStockTable");
    table.innerHTML = "";
    const lowProducts = products.filter(p => p.quantity <= p.minimumStock);

    if (lowProducts.length === 0) {
      table.innerHTML = `<tr><td colspan="5" style="text-align:center;">No low-stock products 🎉</td></tr>`;
      return;
    }

    lowProducts.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(product.name)}</td>
        <td>${product.category}</td>
        <td>${product.quantity}</td>
        <td>${product.minimumStock}</td>
        <td>${getStatusBadge(product)}</td>
      `;
      table.appendChild(row);
    });
  }

  updateDashboard();
}

// =====================================================
// PRODUCTS PAGE (products.html)
// =====================================================
if (document.getElementById("productTable")) {

  const modal = document.getElementById("productModal");

  document.getElementById("openModalBtn").addEventListener("click", openModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  function openModal() {
    modal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Add Product";
    document.getElementById("productForm").reset();
    document.getElementById("editId").value = "";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  document.getElementById("productForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = Number(document.getElementById("productPrice").value);
    const quantity = Number(document.getElementById("productQuantity").value);
    const minimumStock = Number(document.getElementById("minimumStock").value);
    const supplier = document.getElementById("productSupplier").value.trim();
    const editId = document.getElementById("editId").value;

    if (!name || !category || price < 0 || quantity < 0 || minimumStock < 0 || !supplier) {
      alert("Please enter valid product details.");
      return;
    }

    if (editId) {
      const product = products.find(p => p.id === editId);
      if (product) Object.assign(product, { name, category, price, quantity, minimumStock, supplier });
    } else {
      products.push({ id: generateId(), name, category, price, quantity, minimumStock, supplier });
    }

    saveProducts();
    displayProducts();
    closeModal();
  });

  document.getElementById("searchInput").addEventListener("keyup", displayProducts);
  document.getElementById("categoryFilter").addEventListener("change", displayProducts);

  function displayProducts() {
    const table = document.getElementById("productTable");
    const search = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;

    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search);
      const matchesCategory = category === "all" || p.category === category;
      return matchesSearch && matchesCategory;
    });

    table.innerHTML = "";

    if (filtered.length === 0) {
      table.innerHTML = `<tr><td colspan="7" style="text-align:center;">No products found</td></tr>`;
      return;
    }

    filtered.forEach(product => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.id}</td>
        <td><strong>${escapeHtml(product.name)}</strong></td>
        <td>${product.category}</td>
        <td>₹${product.price.toLocaleString("en-IN")}</td>
        <td>${product.quantity}</td>
        <td>${getStatusBadge(product)}</td>
        <td>
          <button class="edit-btn" data-id="${product.id}">Edit</button>
          <button class="delete-btn" data-id="${product.id}">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });

    table.querySelectorAll(".edit-btn").forEach(b => b.addEventListener("click", () => editProduct(b.dataset.id)));
    table.querySelectorAll(".delete-btn").forEach(b => b.addEventListener("click", () => deleteProduct(b.dataset.id)));
  }

  function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("editId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productQuantity").value = product.quantity;
    document.getElementById("minimumStock").value = product.minimumStock;
    document.getElementById("productSupplier").value = product.supplier;

    document.getElementById("modalTitle").textContent = "Edit Product";
    modal.style.display = "flex";
  }

  function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    if (!confirm(`Delete ${product.name}?`)) return;

    products = products.filter(p => p.id !== id);
    saveProducts();
    displayProducts();
  }

  displayProducts();
}

// =====================================================
// STOCK PAGE (stock.html)
// =====================================================
if (document.getElementById("stockInProduct")) {

  function updateStockDropdowns() {
    const stockIn = document.getElementById("stockInProduct");
    const stockOut = document.getElementById("stockOutProduct");

    stockIn.innerHTML = `<option value="">Select Product</option>`;
    stockOut.innerHTML = `<option value="">Select Product</option>`;

    products.forEach(product => {
      stockIn.innerHTML += `<option value="${product.id}">${escapeHtml(product.name)}</option>`;
      stockOut.innerHTML += `<option value="${product.id}">${escapeHtml(product.name)} (Stock: ${product.quantity})</option>`;
    });
  }

  document.getElementById("stockInBtn").addEventListener("click", () => {
    const productId = document.getElementById("stockInProduct").value;
    const quantity = Number(document.getElementById("stockInQuantity").value);

    if (!productId || quantity <= 0) {
      alert("Select a product and enter a valid quantity.");
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    product.quantity += quantity;
    saveProducts();
    updateStockDropdowns();
    document.getElementById("stockInQuantity").value = "";
    alert(`${quantity} units added to ${product.name}.`);
  });

  document.getElementById("stockOutBtn").addEventListener("click", () => {
    const productId = document.getElementById("stockOutProduct").value;
    const quantity = Number(document.getElementById("stockOutQuantity").value);

    if (!productId || quantity <= 0) {
      alert("Select a product and enter a valid quantity.");
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.quantity) {
      alert(`Only ${product.quantity} units are available.`);
      return;
    }

    product.quantity -= quantity;
    saveProducts();
    updateStockDropdowns();
    document.getElementById("stockOutQuantity").value = "";
    alert(`${quantity} units removed from ${product.name}.`);
  });

  updateStockDropdowns();
}

// =====================================================
// SUPPLIERS PAGE (suppliers.html)
// =====================================================
if (document.getElementById("supplierGrid")) {

  document.getElementById("supplierGrid").innerHTML = suppliers.map(s => `
    <div class="supplier-card">
      <div class="supplier-icon">🚚</div>
      <h3>${escapeHtml(s.name)}</h3>
      <p>📞 ${s.phone}</p>
      <p>✉️ ${s.email}</p>
      <p>📍 ${s.city}</p>
    </div>
  `).join("");
}
