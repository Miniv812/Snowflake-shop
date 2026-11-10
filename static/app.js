let cart = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function updateUI() {
    const userBlock = document.getElementById('user-block');
    const adminPanel = document.getElementById('admin-panel');

    if (currentUser) {
        userBlock.innerHTML = `
            <span>👤 ${currentUser.full_name} (${currentUser.role})</span>
            <button class="btn-auth" onclick="logout()">Вийти</button>
        `;
        document.getElementById('email').value = currentUser.email;
        
        if (currentUser.role === 'Admin') {
            adminPanel.style.display = 'block';
        } else {
            adminPanel.style.display = 'none';
        }
    } else {
        userBlock.innerHTML = `
            <button class="btn-auth" onclick="showAuthModal()">🔑 Увійти / Реєстрація</button>
        `;
        adminPanel.style.display = 'none';
    }
}

async function loadProducts() {
    const tempFilter = document.getElementById('temp-filter').value;
    let url = '/api/v1/catalog/products';
    if (tempFilter) {
        url += `?temp_min=${tempFilter}`;
    }

    const response = await fetch(url);
    const products = await response.json();

    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <div>
                    <span class="badge">Температура: до ${p.temp_min}°C</span>
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <p><strong>Матеріал:</strong> ${p.material}</p>
                    <p><strong>Ціна:</strong> ${p.price} грн</p>
                    <p><strong>В наявності:</strong> ${p.stock_quantity} шт.</p>
                </div>
                <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Додати в кошик</button>
            </div>
        `;
    });
}

function addToCart(id, name, price) {
    cart.push({ product_id: id, name, price, selected_size: 'L', quantity: 1 });
    document.getElementById('cart-count').innerText = cart.length;
    alert(`Товар "${name}" додано до кошика!`);
}

async function createProduct(event) {
    event.preventDefault();
    const payload = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        material: document.getElementById('p-material').value,
        temp_min: parseInt(document.getElementById('p-temp').value),
        size_grid: document.getElementById('p-size').value,
        stock_quantity: parseInt(document.getElementById('p-stock').value),
        description: document.getElementById('p-desc').value
    };

    const response = await fetch('/api/v1/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('Новий товар успішно додано у докер-базу PostgreSQL!');
        loadProducts();
    } else {
        alert('Помилка додавання товару');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        hideAuthModal();
        updateUI();
    } else {
        document.getElementById('auth-error').innerText = data.detail;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Акаунт створено! Тепер ви можете увійти.');
        switchTab('login');
    } else {
        document.getElementById('auth-error').innerText = data.detail;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
}

function showAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function hideAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function switchTab(tab) {
    if (tab === 'login') {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-reg-btn').classList.remove('active');
    } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('tab-login-btn').classList.remove('active');
        document.getElementById('tab-reg-btn').classList.add('active');
    }
}

updateUI();
loadProducts();