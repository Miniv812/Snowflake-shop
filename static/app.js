/*
  Клієнтська логіка інтернет-магазину «Сніжинка» (Frontend Controller).
  Відповідає за взаємодію з REST API, завантаження категорій, динамічне
  оновлення каталогу з фільтрами, роботу кошика, оформлення й історію замовлень покупця,
  автентифікацію користувачів і панель адміністратора.
*/

let cart = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let loadedProducts = [];
let categoriesList = [];
let myOrders = [];
let adminOrders = [];

// Формує HTTP-заголовки з токеном авторизації для захищених запитів
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser && currentUser.access_token) {
        headers['Authorization'] = `Bearer ${currentUser.access_token}`;
    }
    return headers;
}

// Повертає ключ localStorage для збереження кошика поточного покупця
function getCartStorageKey() {
    if (!currentUser || currentUser.role === 'Admin') return null;
    return `cart_${currentUser.email}`;
}

// Зберігає поточний стан кошика в localStorage
function saveCartToStorage() {
    const key = getCartStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(cart));
}

// Відновлює кошик поточного покупця з localStorage
function loadCartFromStorage() {
    const key = getCartStorageKey();
    if (!key) {
        cart = [];
        updateCartCount();
        return;
    }

    try {
        const saved = JSON.parse(localStorage.getItem(key));
        cart = Array.isArray(saved) ? saved : [];
    } catch (e) {
        cart = [];
    }
    updateCartCount();
}

// Синхронізує збережений кошик з актуальними залишками товарів на складі
function syncCartWithStock() {
    if (!currentUser || currentUser.role === 'Admin' || cart.length === 0) return;

    const countByProduct = {};
    const syncedCart = [];
    let changed = false;

    for (const item of cart) {
        const product = loadedProducts.find(p => p.id === item.product_id);
        if (!product) {
            syncedCart.push(item);
            continue;
        }

        const currentCount = countByProduct[item.product_id] || 0;
        if (currentCount < product.stock_quantity) {
            syncedCart.push({
                ...item,
                name: product.name,
                price: product.price
            });
            countByProduct[item.product_id] = currentCount + 1;
        } else {
            changed = true;
        }
    }

    if (changed) {
        cart = syncedCart;
        saveCartToStorage();
        updateCartCount();
    }
}

// Завантажує список категорій із сервера та заповнює випадаючі списки
async function loadCategories() {
    try {
        const response = await fetch('/api/v1/catalog/categories');
        if (!response.ok) return;
        categoriesList = await response.json();

        const filterSelect = document.getElementById('category-filter');
        const addSelect = document.getElementById('p-category');
        const editSelect = document.getElementById('edit-p-category');

        const optionsHtml = categoriesList
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('');

        if (filterSelect) {
            filterSelect.innerHTML = `<option value="">Усі категорії</option>${optionsHtml}`;
        }
        if (addSelect) {
            addSelect.innerHTML = `<option value="" disabled selected>Оберіть категорію...</option>${optionsHtml}`;
        }
        if (editSelect) {
            editSelect.innerHTML = optionsHtml;
        }
    } catch (err) {
        console.error('Помилка завантаження категорій:', err);
    }
}

// Оновлює елементи інтерфейсу залежно від статусу входу та ролі користувача
async function updateUI() {
    const userBlock = document.getElementById('user-block');
    const adminPanel = document.getElementById('admin-panel');
    const cartBtn = document.getElementById('cart-btn');
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const adminOrdersBtn = document.getElementById('admin-orders-btn');

    if (currentUser) {
        userBlock.innerHTML = `
            <span style="color: white; margin-right: 10px;">👤 ${currentUser.full_name} (${currentUser.role})</span>
            <button class="btn-auth" onclick="logout()">Вийти</button>
        `;

        const isAdmin = currentUser.role === 'Admin';
        if (cartBtn) cartBtn.style.display = isAdmin ? 'none' : 'inline-block';
        if (adminPanel) adminPanel.style.display = isAdmin ? 'block' : 'none';
        if (adminOrdersBtn) adminOrdersBtn.style.display = isAdmin ? 'inline-block' : 'none';
        if (myOrdersBtn) myOrdersBtn.style.display = 'none';

        if (isAdmin) {
            cart = [];
            updateCartCount();
            await loadAdminOrders();
        } else {
            loadCartFromStorage();
            await loadMyOrders();
        }
    } else {
        userBlock.innerHTML = `
            <button class="btn-auth" onclick="showAuthModal()">🔑 Увійти / Реєстрація</button>
        `;
        if (cartBtn) cartBtn.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
        if (myOrdersBtn) myOrdersBtn.style.display = 'none';
        if (adminOrdersBtn) adminOrdersBtn.style.display = 'none';
        cart = [];
        updateCartCount();
        myOrders = [];
        adminOrders = [];
    }

    loadProducts();
}

// Завантажує список товарів з урахуванням активних фільтрів і будує сітку карток
async function loadProducts() {
    const categoryId = document.getElementById('category-filter')?.value || '';
    const search = document.getElementById('search-input')?.value || '';
    const minVal = parseInt(document.getElementById('temp-range-min')?.value || 5);
    const maxVal = parseInt(document.getElementById('temp-range-max')?.value || 40);
    const tempFrom = -Math.min(minVal, maxVal);
    const tempTo = -Math.max(minVal, maxVal);
    const minPrice = document.getElementById('min-price')?.value || '';
    const maxPrice = document.getElementById('max-price')?.value || '';
    const material = document.getElementById('material-input')?.value || '';
    const size = document.getElementById('size-input')?.value || '';
    const color = document.getElementById('color-input')?.value || '';

    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    params.append('temp_from', tempFrom);
    params.append('temp_to', tempTo);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (material) params.append('material', material);
    if (size) params.append('size', size);
    if (color) params.append('color', color);

    const grid = document.getElementById('products-grid');

    try {
        const response = await fetch(`/api/v1/catalog/products?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Помилка сервера: ${response.status}`);
        }
        loadedProducts = await response.json();
        syncCartWithStock();
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Не вдалося завантажити товари. Перевірте консоль браузера (F12).</p>`;
        return;
    }

    grid.innerHTML = '';

    if (loadedProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Товарів за вказаними фільтрами не знайдено.</p>';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 'Admin';

    loadedProducts.forEach(p => {
        const inStock = p.stock_quantity > 0;
        const sizes = (p.size_grid || 'Universal').split(',').map(s => s.trim());
        const colors = (p.color || 'Чорний').split(',').map(c => c.trim());
        const categoryObj = categoriesList.find(c => c.id === p.category_id);
        const categoryName = categoryObj ? categoryObj.name : '';

        const sizeOptionsHtml = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        const colorOptionsHtml = colors.map(c => `<option value="${c}">${c}</option>`).join('');

        const imageHtml = p.image_url
            ? `<div class="product-img-wrapper"><img src="${p.image_url}" alt="${p.name}"></div>`
            : `<div class="product-img-wrapper"><div class="product-img-placeholder"><span>🧥</span><small>Фото товару</small></div></div>`;

        let buyButtonHtml = '';
        if (!isAdmin) {
            buyButtonHtml = inStock
                ? `<button onclick="addToCartById(${p.id})">У кошик</button>`
                : `<button disabled class="btn-disabled">Немає в наявності</button>`;
        }

        const adminActionsHtml = isAdmin
            ? `<button class="btn-edit" onclick="openEditModal(${p.id})">✏️ Змінити товар</button>
               <button class="btn-delete" onclick="deleteProductById(${p.id})">🗑️ Видалити товар</button>`
            : '';

        grid.innerHTML += `
            <div class="product-card ${!inStock ? 'out-of-stock-card' : ''}">
                <div>
                    ${imageHtml}
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge">до ${p.temp_min}°C</span>
                        ${categoryName ? `<span style="font-size: 0.78em; color: #1e5799; background: #eef4f8; padding: 3px 7px; border-radius: 4px; font-weight: 600;">${categoryName}</span>` : ''}
                    </div>
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.85em; color: #666;">${p.description || ''}</p>
                    <p style="font-size: 0.9em;"><strong>Матеріал:</strong> ${p.material}</p>

                    ${!isAdmin && inStock ? `
                        <div style="margin: 8px 0;">
                            <label style="font-size: 0.8em; font-weight: bold;">Колір:</label>
                            <select id="color-select-${p.id}" style="width: 100%; padding: 4px; margin-bottom: 5px; border-radius: 4px; border: 1px solid #ccc;">
                                ${colorOptionsHtml}
                            </select>
                            <label style="font-size: 0.8em; font-weight: bold;">Розмір:</label>
                            <select id="size-select-${p.id}" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
                                ${sizeOptionsHtml}
                            </select>
                        </div>
                    ` : `
                        <p style="font-size: 0.85em;"><strong>Кольори:</strong> ${p.color}</p>
                        <p style="font-size: 0.85em;"><strong>Розміри:</strong> ${p.size_grid}</p>
                    `}

                    <p style="font-size: 1em; color: #27ae60;"><strong>${p.price} грн</strong></p>
                    <p style="font-size: 0.8em; color: ${inStock ? '#888' : '#e74c3c'}; font-weight: ${inStock ? 'normal' : 'bold'};">
                        ${inStock ? 'В наявності: ' + p.stock_quantity + ' шт.' : 'Залишок: 0 шт.'}
                    </p>
                </div>
                <div>
                    ${buyButtonHtml}
                    ${adminActionsHtml}
                </div>
            </div>
        `;
    });
}

// Скидає всі поля фільтрів до початкових значень і оновлює каталог
function resetFilters() {
    if (document.getElementById('category-filter')) document.getElementById('category-filter').value = '';
    document.getElementById('search-input').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    if (document.getElementById('material-input')) document.getElementById('material-input').value = '';
    if (document.getElementById('size-input')) document.getElementById('size-input').value = '';
    if (document.getElementById('color-input')) document.getElementById('color-input').value = '';
    if (document.getElementById('temp-range-min')) document.getElementById('temp-range-min').value = 5;
    if (document.getElementById('temp-range-max')) document.getElementById('temp-range-max').value = 40;
    handleTempSlider(true);
}

// Оновлює підписи та кольорову шкалу подвійного повзунка температури
function handleTempSlider(shouldLoad = true) {
    const minSlider = document.getElementById('temp-range-min');
    const maxSlider = document.getElementById('temp-range-max');
    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);

    if (minVal > maxVal) {
        [minVal, maxVal] = [maxVal, minVal];
    }

    document.getElementById('temp-from-label').innerText = `-${minVal}°C`;
    document.getElementById('temp-to-label').innerText = `-${maxVal}°C`;

    const percent1 = ((minVal - 5) / 35) * 100;
    const percent2 = ((maxVal - 5) / 35) * 100;
    const track = document.getElementById('temp-slider-track');
    if (track) {
        track.style.background = `linear-gradient(to right, #e0e0e0 ${percent1}%, #27ae60 ${percent1}%, #27ae60 ${percent2}%, #e0e0e0 ${percent2}%)`;
    }

    if (shouldLoad) {
        loadProducts();
    }
}

// Оновлює лічильник кількості товарів на кнопці кошика
function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
}

// Додає вибраний товар до кошика з перевіркою доступної кількості на складі
function addToCartById(id) {
    if (currentUser && currentUser.role === 'Admin') return;
    if (!currentUser) {
        alert('Для додавання товарів у кошик необхідно увійти в акаунт!');
        showAuthModal();
        return;
    }

    const product = loadedProducts.find(p => p.id === id);
    if (!product) return;

    if (product.stock_quantity <= 0) {
        alert(`Товар "${product.name}" наразі відсутній на складі.`);
        return;
    }

    const alreadyInCartCount = cart.filter(item => item.product_id === id).length;
    if (alreadyInCartCount >= product.stock_quantity) {
        alert(`Неможливо додати більше: на складі залишилось лише ${product.stock_quantity} шт. товару "${product.name}".`);
        return;
    }

    const selectedColor = document.getElementById(`color-select-${id}`)?.value || product.color.split(',')[0].trim();
    const selectedSize = document.getElementById(`size-select-${id}`)?.value || product.size_grid.split(',')[0].trim();

    cart.push({
        cart_item_id: Date.now() + Math.random(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        selected_size: selectedSize,
        selected_color: selectedColor
    });

    saveCartToStorage();
    updateCartCount();
    alert(`Товар "${product.name}" (${selectedColor}, розмір ${selectedSize}) додано до кошика! (${alreadyInCartCount + 1} з ${product.stock_quantity} шт.)`);
}

// Відкриває модальне вікно кошика та підставляє дані авторизованого покупця
function openCartModal() {
    if (!currentUser) return;
    document.getElementById('checkout-user-name').innerText = currentUser.full_name;
    document.getElementById('checkout-user-email').innerText = currentUser.email;
    document.getElementById('order-message').innerHTML = '';
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'flex';
}

// Закриває модальне вікно кошика
function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Відображає список товарів у кошику та підраховує загальну суму
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777;">Кошик порожній</p>';
        document.getElementById('cart-total-price').innerText = '0';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item-row">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>Колір: ${item.selected_color} | Розмір: ${item.selected_size}</small><br>
                    <small style="color: #27ae60; font-weight: bold;">${item.price} грн</small>
                </div>
                <div>
                    <button style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;" onclick="removeFromCart(${index})">🗑️ Видалити</button>
                </div>
            </div>
        `;
    });
    document.getElementById('cart-total-price').innerText = total.toFixed(2);
}

// Видаляє окрему позицію з кошика за її індексом та оновлює localStorage
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartCount();
    renderCartItems();
}

// Перевіряє контактні дані та відправляє замовлення на сервер
async function submitOrder(event) {
    event.preventDefault();
    if (!currentUser) return;
    if (cart.length === 0) {
        alert('Додайте товари у кошик перед оформленням!');
        return;
    }

    const p1 = document.getElementById('phone-1').value.trim();
    const p2 = document.getElementById('phone-2').value.trim();
    const p3 = document.getElementById('phone-3').value.trim();
    const p4 = document.getElementById('phone-4').value.trim();

    if (!/^\d{2}$/.test(p1) || !/^\d{3}$/.test(p2) || !/^\d{2}$/.test(p3) || !/^\d{2}$/.test(p4)) {
        alert('Введіть коректний номер телефону у форматі +380 XX XXX XX XX');
        return;
    }

    const phone = `+380 ${p1} ${p2} ${p3} ${p4}`;
    const address = document.getElementById('address').value;

    const payload = {
        user_email: currentUser.email,
        phone: phone,
        delivery_address: address,
        items: cart.map(item => ({
            product_id: item.product_id,
            selected_size: item.selected_size,
            selected_color: item.selected_color
        }))
    };

    const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok) {
        document.getElementById('order-message').innerHTML = `
            <p style="color: green;"><strong>Успішно!</strong> Замовлення #${result.order_id} оформлено на суму ${result.total_amount} грн.</p>
        `;
        cart = [];
        saveCartToStorage();
        document.getElementById('order-form').reset();
        updateCartCount();
        renderCartItems();
        loadProducts();
        await loadMyOrders();
    } else {
        document.getElementById('order-message').innerHTML = `
            <p style="color: red;"><strong>Помилка:</strong> ${result.detail}</p>
        `;
    }
}

// Форматує дату створення замовлення в український формат
function formatOrderDate(isoString) {
    const normalized = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    return new Date(normalized).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Повертає CSS-клас бейджа відповідно до статусу замовлення
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Відправлено':
            return 'status-shipped';
        case 'Виконано':
            return 'status-completed';
        case 'Скасовано':
            return 'status-cancelled';
        default:
            return 'status-processing';
    }
}

// Завантажує замовлення покупця та показує кнопку історії лише якщо є хоча б одне замовлення
async function loadMyOrders() {
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const countSpan = document.getElementById('my-orders-count');
    if (!currentUser || currentUser.role === 'Admin') {
        if (myOrdersBtn) myOrdersBtn.style.display = 'none';
        return;
    }

    try {
        const response = await fetch('/api/v1/orders/my', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            if (myOrdersBtn) myOrdersBtn.style.display = 'none';
            return;
        }
        myOrders = await response.json();
        if (myOrders.length > 0 && myOrdersBtn) {
            if (countSpan) countSpan.innerText = myOrders.length;
            myOrdersBtn.style.display = 'inline-block';
        } else if (myOrdersBtn) {
            myOrdersBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('Помилка завантаження історії замовлень:', err);
    }
}

// Відкриває модальне вікно історії замовлень покупця
async function openMyOrdersModal() {
    if (!currentUser) return;
    await loadMyOrders();
    renderMyOrders();
    document.getElementById('my-orders-modal').style.display = 'flex';
}

// Закриває модальне вікно історії замовлень покупця
function closeMyOrdersModal() {
    document.getElementById('my-orders-modal').style.display = 'none';
}

// Рендерить список замовлень поточного покупця
function renderMyOrders() {
    const container = document.getElementById('my-orders-container');
    if (!container) return;

    if (myOrders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777;">У вас ще немає оформлених замовлень.</p>';
        return;
    }

    container.innerHTML = myOrders.map(order => {
        const itemsHtml = order.items.map(item => `
            <li>
                <span>
                    <strong>${item.product_name}</strong>
                    <small style="color: #666;">(${item.selected_color}, розмір ${item.selected_size})</small>
                </span>
                <strong>${item.price_per_unit} грн</strong>
            </li>
        `).join('');

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <strong>Замовлення #${order.id}</strong>
                        <span style="color: #777; font-size: 0.85em; margin-left: 8px;">від ${formatOrderDate(order.created_at)}</span>
                    </div>
                    <span class="order-status-badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                </div>
                <div class="order-meta">
                    <div><strong>📍 Адреса доставки:</strong> ${order.delivery_address}</div>
                    <div><strong>📞 Телефон:</strong> ${order.phone}</div>
                </div>
                <ul class="order-items-list">${itemsHtml}</ul>
                <div class="order-card-footer">
                    <span style="color: #666; font-size: 0.85em;">Позицій: ${order.items.length} шт.</span>
                    <strong style="color: #27ae60; font-size: 1.05em;">Разом: ${order.total_amount.toFixed(2)} грн</strong>
                </div>
            </div>
        `;
    }).join('');
}

// Завантажує всі замовлення клієнтів для панелі адміністратора
async function loadAdminOrders() {
    const countSpan = document.getElementById('admin-orders-count');
    if (!currentUser || currentUser.role !== 'Admin') return;

    try {
        const response = await fetch('/api/v1/orders', {
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
        adminOrders = await response.json();
        if (countSpan) countSpan.innerText = adminOrders.length;
    } catch (err) {
        console.error('Помилка завантаження замовлень для адміністратора:', err);
    }
}

// Відкриває модальне вікно керування замовленнями клієнтів
async function openAdminOrdersModal() {
    if (!currentUser || currentUser.role !== 'Admin') return;
    await loadAdminOrders();
    renderAdminOrders();
    document.getElementById('admin-orders-modal').style.display = 'flex';
}

// Закриває модальне вікно керування замовленнями клієнтів
function closeAdminOrdersModal() {
    document.getElementById('admin-orders-modal').style.display = 'none';
}

// Відображає всі замовлення клієнтів із можливістю фільтрації та зміни статусу
function renderAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    const filterStatus = document.getElementById('admin-order-status-filter')?.value || '';
    if (!container) return;

    const filteredOrders = filterStatus
        ? adminOrders.filter(o => o.status === filterStatus)
        : adminOrders;

    if (filteredOrders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777;">Замовлень за вибраним критерієм не знайдено.</p>';
        return;
    }

    const statuses = ['Обробляється', 'Відправлено', 'Виконано', 'Скасовано'];

    container.innerHTML = filteredOrders.map(order => {
        const itemsHtml = order.items.map(item => `
            <li>
                <span>
                    <strong>${item.product_name}</strong>
                    <small style="color: #666;">(${item.selected_color}, розмір ${item.selected_size})</small>
                </span>
                <strong>${item.price_per_unit} грн</strong>
            </li>
        `).join('');

        const statusOptions = statuses
            .map(st => `<option value="${st}" ${order.status === st ? 'selected' : ''}>${st}</option>`)
            .join('');

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <strong>Замовлення #${order.id}</strong>
                        <span style="color: #777; font-size: 0.85em; margin-left: 8px;">від ${formatOrderDate(order.created_at)}</span>
                    </div>
                    <span class="order-status-badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                </div>
                <div class="order-meta">
                    <div><strong>👤 Клієнт:</strong> ${order.customer_name} (${order.customer_email})</div>
                    <div><strong>📞 Телефон:</strong> ${order.phone}</div>
                    <div><strong>📍 Доставка:</strong> ${order.delivery_address}</div>
                </div>
                <ul class="order-items-list">${itemsHtml}</ul>
                <div class="order-card-footer">
                    <strong style="color: #27ae60; font-size: 1.05em;">Сума: ${order.total_amount.toFixed(2)} грн</strong>
                    <div class="order-status-control">
                        <label style="font-size: 0.85em; font-weight: bold;">Статус:</label>
                        <select onchange="updateOrderStatus(${order.id}, this.value)">
                            ${statusOptions}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Змінює статус вибраного замовлення на сервері та оновлює інтерфейс
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/v1/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (response.ok) {
            const idx = adminOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                adminOrders[idx] = data;
            }
            renderAdminOrders();
            loadProducts();
        } else {
            alert(`Помилка: ${data.detail || 'Не вдалося змінити статус'}`);
            renderAdminOrders();
        }
    } catch (err) {
        console.error('Помилка оновлення статусу замовлення:', err);
        alert('Помилка з’єднання із сервером');
    }
}

// Стискає завантажене зображення через Canvas та кодує його в рядок Base64
function compressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 450;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Створює новий товар у базі даних (захищений маршрут адміністратора)
async function createProduct(event) {
    event.preventDefault();
    const fileInput = document.getElementById('p-image');
    let imageBase64 = null;

    if (fileInput && fileInput.files.length > 0) {
        imageBase64 = await compressImageToBase64(fileInput.files[0]);
    }

    const payload = {
        category_id: parseInt(document.getElementById('p-category').value),
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        material: document.getElementById('p-material').value,
        color: document.getElementById('p-color').value,
        temp_min: parseInt(document.getElementById('p-temp').value),
        size_grid: document.getElementById('p-size').value,
        stock_quantity: parseInt(document.getElementById('p-stock').value),
        description: document.getElementById('p-desc').value,
        image_url: imageBase64
    };

    const response = await fetch('/api/v1/catalog/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('Новий товар успішно додано!');
        event.target.reset();
        loadProducts();
    } else {
        const err = await response.json();
        alert(`Помилка: ${err.detail || 'Не вдалося додати товар'}`);
    }
}

// Видаляє товар із каталогу за його ідентифікатором (захищений маршрут адміністратора)
async function deleteProductById(id) {
    if (!confirm('Ви дійсно бажаєте видалити цей товар із бази даних?')) return;

    const response = await fetch(`/api/v1/catalog/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (response.ok) {
        alert('Товар успішно видалено!');
        loadProducts();
    } else {
        const err = await response.json();
        alert(`Помилка: ${err.detail || 'Не вдалося видалити товар'}`);
    }
}

// Відкриває модальне вікно редагування та заповнює поля поточними даними товару
function openEditModal(id) {
    const product = loadedProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-p-id').value = product.id;
    document.getElementById('edit-p-name').value = product.name;
    if (document.getElementById('edit-p-category') && product.category_id) {
        document.getElementById('edit-p-category').value = product.category_id;
    }
    document.getElementById('edit-p-price').value = product.price;
    document.getElementById('edit-p-stock').value = product.stock_quantity;
    document.getElementById('edit-p-material').value = product.material;
    document.getElementById('edit-p-color').value = product.color;
    document.getElementById('edit-p-temp').value = product.temp_min;
    document.getElementById('edit-p-size').value = product.size_grid;
    document.getElementById('edit-p-desc').value = product.description || '';
    document.getElementById('edit-p-image').value = '';

    document.getElementById('edit-modal').style.display = 'flex';
}

// Закриває модальне вікно редагування товару
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// Зберігає відредаговані параметри товару на сервері (захищений маршрут адміністратора)
async function updateProduct(event) {
    event.preventDefault();
    const id = document.getElementById('edit-p-id').value;
    const fileInput = document.getElementById('edit-p-image');
    let imageBase64 = null;

    if (fileInput && fileInput.files.length > 0) {
        imageBase64 = await compressImageToBase64(fileInput.files[0]);
    }

    const payload = {
        category_id: parseInt(document.getElementById('edit-p-category').value),
        name: document.getElementById('edit-p-name').value,
        price: parseFloat(document.getElementById('edit-p-price').value),
        stock_quantity: parseInt(document.getElementById('edit-p-stock').value),
        material: document.getElementById('edit-p-material').value,
        color: document.getElementById('edit-p-color').value,
        temp_min: parseInt(document.getElementById('edit-p-temp').value),
        size_grid: document.getElementById('edit-p-size').value,
        description: document.getElementById('edit-p-desc').value,
        image_url: imageBase64
    };

    const response = await fetch(`/api/v1/catalog/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('Зміни успішно збережено!');
        closeEditModal();
        loadProducts();
    } else {
        const err = await response.json();
        alert(`Помилка: ${err.detail || 'Не вдалося оновити товар'}`);
    }
}

// Виконує авторизацію користувача через API
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const errorBox = document.getElementById('auth-error');
    errorBox.innerText = '';

    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        event.target.reset();
        hideAuthModal();
        updateUI();
    } else {
        errorBox.innerText = data.detail || 'Помилка входу';
    }
}

// Реєструє нового покупця в системі (окремі поля імені та прізвища)
async function handleRegister(event) {
    event.preventDefault();
    const firstName = document.getElementById('reg-first-name').value.trim();
    const lastName = document.getElementById('reg-last-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    const errorBox = document.getElementById('auth-error');
    errorBox.innerText = '';

    const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            password
        })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Акаунт створено! Тепер увійдіть.');
        event.target.reset();
        switchTab('login');
    } else {
        errorBox.innerText = data.detail || 'Помилка реєстрації';
    }
}

// Завершує сеанс користувача та очищає збережені дані профілю
function logout() {
    currentUser = null;
    cart = [];
    updateCartCount();
    localStorage.removeItem('currentUser');
    updateUI();
}

// Відкриває модальне вікно входу / реєстрації
function showAuthModal() {
    document.getElementById('auth-error').innerText = '';
    document.getElementById('auth-modal').style.display = 'flex';
}

// Закриває модальне вікно входу / реєстрації
function hideAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

// Перемикає вкладки між формою входу та формою реєстрації
function switchTab(tab) {
    document.getElementById('auth-error').innerText = '';
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

// Налаштовує фільтрацію цифр і автоперехід фокусу між полями номера телефону
function initPhoneInputs() {
    const parts = Array.from(document.querySelectorAll('.phone-part'));
    parts.forEach((input, idx) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '');
            if (input.value.length === input.maxLength && idx < parts.length - 1) {
                parts[idx + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && idx > 0) {
                parts[idx - 1].focus();
            }
        });
    });
}

// Початкова ініціалізація компонентів при завантаженні сторінки
initPhoneInputs();
handleTempSlider(false);
loadCategories().then(() => updateUI());