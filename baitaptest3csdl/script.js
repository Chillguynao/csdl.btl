document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const mainContent = document.querySelector('.main-content');

    // Biến toàn cục cho từng phần
    let editingCustomerId = null;
    let editingOrderId = null;
    let editingProductId = null;
    let editingEmployeeId = null;
    let orderDetails = [];

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const section = link.textContent.trim();
            loadSection(section);
        });
    });

    function loadSection(section) {
        switch (section) {
            case 'Khách hàng':
                loadCustomers();
                break;
            case 'Đơn hàng':
                loadOrders();
                break;
            case 'Sản phẩm':
                loadProducts();
                break;
            case 'Nhân viên':
                loadEmployees();
                break;
            case 'Nhà cung cấp':
                loadSuppliers();
                break;
            case 'Thống kê':
                loadStatistics();
                break;
            default:
                mainContent.innerHTML = '<p>Chọn một chức năng để hiển thị dữ liệu</p>';
        }
    }

    // Customers
    async function loadCustomers() {
        mainContent.innerHTML = `
            <h2>Quản lý Khách hàng</h2>
            <table id="customerTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ</th>
                        <th>Tên</th>
                        <th>Tên đầy đủ</th>
                        <th>Số điện thoại</th>
                        <th>Email</th>
                        <th>Địa chỉ</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Thêm/Sửa Khách hàng</h3>
                <form id="customerForm">
                    <label>Họ:</label><input type="text" id="first_name" required>
                    <label>Tên:</label><input type="text" id="last_name" required>
                    <label>Tên đầy đủ:</label><input type="text" id="name" required>
                    <label>Số điện thoại:</label><input type="text" id="phone_number">
                    <label>Email:</label><input type="email" id="email">
                    <label>Địa chỉ:</label><input type="text" id="address">
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
            <div id="customerInfo"></div>
            <div id="orderDetailForm">
                <label>Ngày đặt đơn hàng:</label>
                <input type="date" id="order_date" required>
                <label>Chọn sản phẩm:</label>
                <select id="productSelect"></select>
                <label>Số lượng:</label>
                <input type="number" id="productQuantity" min="1" value="1">
                <button type="button" id="addOrderDetail">Thêm sản phẩm</button>
            </div>
            <table id="orderDetailTable">
                <thead>
                    <tr>
                        <th>ID Đơn hàng</th>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="orderTotal"></div>
            <button id="saveOrder">Lưu đơn hàng</button>
        `;

        const form = document.getElementById('customerForm');
        const cancelEdit = document.getElementById('cancelEdit');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const customer = {
                First_name: document.getElementById('first_name').value,
                Last_name: document.getElementById('last_name').value,
                name: document.getElementById('name').value,
                Phone_number: document.getElementById('phone_number').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value
            };

            try {
                let response;
                if (editingCustomerId) {
                    response = await fetch(`http://127.0.0.1:8000/customer/${editingCustomerId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(customer)
                    });
                } else {
                    response = await fetch('http://127.0.0.1:8000/customer/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(customer)
                    });
                }

                if (response.ok) {
                    loadCustomers();
                    form.reset();
                    cancelEdit.style.display = 'none';
                    editingCustomerId = null;
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi lưu khách hàng: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        });

        cancelEdit.addEventListener('click', () => {
            form.reset();
            cancelEdit.style.display = 'none';
            editingCustomerId = null;
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/customer/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const customers = await response.json();
            const tbody = document.querySelector('#customerTable tbody');
            tbody.innerHTML = '';
            if (customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">Không có khách hàng nào</td></tr>';
            } else {
                customers.forEach(customer => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${customer.Customer_id}</td>
                        <td>${customer.First_name}</td>
                        <td>${customer.Last_name}</td>
                        <td>${customer.name}</td>
                        <td>${customer.Phone_number || ''}</td>
                        <td>${customer.email || ''}</td>
                        <td>${customer.address || ''}</td>
                        <td>
                            <button onclick="editCustomer(${customer.Customer_id})">Sửa</button>
                            <button onclick="deleteCustomer(${customer.Customer_id})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách khách hàng: ' + error.message);
        }

        document.getElementById('phone_number').addEventListener('blur', async function() {
            const phone = this.value;
            if (phone) {
                try {
                    const res = await fetch(`http://127.0.0.1:8000/customer/?phone=${phone}`);
                    if (res.ok) {
                        const customers = await res.json();
                        if (customers.length > 0) {
                            const c = customers[0];
                            document.getElementById('customerInfo').innerHTML = `
                                <div><b>Họ tên:</b> ${c.First_name} ${c.Last_name}</div>
                                <div><b>Email:</b> ${c.email || ''}</div>
                                <div><b>Địa chỉ:</b> ${c.address || ''}</div>
                            `;
                        } else {
                            document.getElementById('customerInfo').innerHTML = 'Không tìm thấy khách hàng';
                        }
                    }
                } catch {}
            }
        });

        // Load sản phẩm vào select
        const productSelect = document.getElementById('productSelect');
        if (productSelect) {
            try {
                const res = await fetch('http://127.0.0.1:8000/perfume/');
                if (res.ok) {
                    const products = await res.json();
                    productSelect.innerHTML = '';
                    products.forEach(p => {
                        const option = document.createElement('option');
                        option.value = p.Product_id;
                        option.textContent = `${p.ProductName} (${p.SalePrice}đ)`;
                        option.dataset.price = p.SalePrice;
                        productSelect.appendChild(option);
                    });
                }
            } catch (e) {
                productSelect.innerHTML = '<option>Lỗi tải sản phẩm</option>';
            }
        }

        document.getElementById('addOrderDetail').onclick = function() {
            const productSelect = document.getElementById('productSelect');
            const productId = parseInt(productSelect.value);
            const productName = productSelect.options[productSelect.selectedIndex].text;
            const unitPrice = parseFloat(productSelect.options[productSelect.selectedIndex].dataset.price);
            const quantity = parseInt(document.getElementById('productQuantity').value);

            // Kiểm tra đã có sản phẩm này chưa
            const existing = orderDetails.find(item => item.productId === productId);
            if (existing) {
                existing.quantity += quantity;
            } else {
                orderDetails.push({ productId, productName, unitPrice, quantity });
            }
            renderOrderDetailTable();
        };

        function renderOrderDetailTable() {
            const tbody = document.querySelector('#orderDetailTable tbody');
            tbody.innerHTML = '';
            let total = 0;
            orderDetails.forEach((item, idx) => {
                const thanhTien = item.unitPrice * item.quantity;
                total += thanhTien;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.orderId || ''}</td>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unitPrice.toLocaleString()}</td>
                    <td>${thanhTien.toLocaleString()}</td>
                    <td><button onclick="removeOrderDetail(${idx})">Xóa</button></td>
                `;
                tbody.appendChild(row);
            });
            document.getElementById('orderTotal').innerText = 'Tổng tiền: ' + total.toLocaleString();
        }

        window.removeOrderDetail = function(idx) {
            orderDetails.splice(idx, 1);
            renderOrderDetailTable();
        }

        document.getElementById('saveOrder').onclick = async function() {
            if (orderDetails.length === 0) {
                alert('Vui lòng thêm ít nhất một sản phẩm!');
                return;
            }
            const phone = document.getElementById('phone_number').value;
            const orderDate = document.getElementById('order_date').value;
            const res = await fetch(`http://127.0.0.1:8000/customer/?phone=${phone}`);
            const customers = await res.json();
            if (!customers.length) {
                alert('Không tìm thấy khách hàng!');
                return;
            }
            const customerId = customers[0].Customer_id;
            // Tính tổng số lượng và tổng tiền
            let totalQuantity = 0, totalAmount = 0;
            orderDetails.forEach(item => {
                totalQuantity += item.quantity;
                totalAmount += item.unitPrice * item.quantity;
            });
            // Gọi API tạo đơn hàng (cần sửa API nhận thêm Quantity và TotalAmount)
            const orderRes = await fetch('http://127.0.0.1:8000/orders/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    OrderDate: orderDate,
                    Customer_id: customerId,
                    Quantity: totalQuantity,
                    TotalAmount: totalAmount
                })
            });
            if (!orderRes.ok) {
                alert('Lỗi khi lưu đơn hàng');
                return;
            }
            const order = await orderRes.json();
            for (const item of orderDetails) {
                await fetch('http://127.0.0.1:8000/orderdetails/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        OrderID: order.OrderID,
                        Product_id: item.productId,
                        Quantity: item.quantity,
                        UnitPrice: item.unitPrice,
                        TotalAmount: item.unitPrice * item.quantity
                    })
                });
            }
            alert('Lưu đơn hàng thành công!');
            orderDetails = [];
            renderOrderDetailTable();
            // Chuyển sang tab Đơn hàng và load lại danh sách đơn hàng
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            document.querySelector('.sidebar a:nth-child(2)').classList.add('active'); // Đơn hàng là menu thứ 2
            loadOrders();
        };
    }

    window.editCustomer = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/customer/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const customer = await response.json();
            document.getElementById('first_name').value = customer.First_name;
            document.getElementById('last_name').value = customer.Last_name;
            document.getElementById('name').value = customer.name;
            document.getElementById('phone_number').value = customer.Phone_number || '';
            document.getElementById('email').value = customer.email || '';
            document.getElementById('address').value = customer.address || '';
            document.getElementById('cancelEdit').style.display = 'inline';
            editingCustomerId = id;
        } catch (error) {
            alert('Lỗi khi tải thông tin khách hàng: ' + error.message);
        }
    };

    window.deleteCustomer = async (id) => {
        if (confirm('Bạn có chắc muốn xóa khách hàng này?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/customer/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadCustomers();
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi xóa khách hàng: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    // Orders
    async function loadOrders() {
        mainContent.innerHTML = `
            <h2>Quản lý Đơn hàng</h2>
            <table id="orderTable">
                <thead>
                    <tr>
                        <th>ID Đơn hàng</th>
                        <th>Ngày đặt</th>
                        <th>Số điện thoại Khách hàng</th>
                        <th>Số lượng</th>
                        <th>Tổng số tiền</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Tìm kiếm Đơn hàng</h3>
                <form id="orderSearchForm">
                    <label>ID Đơn hàng:</label><input type="number" id="search_order_id" placeholder="Nhập ID đơn hàng">
                    <button type="submit">Tìm kiếm đơn hàng</button>
                </form>
            </div>
        `;

        const searchForm = document.getElementById('orderSearchForm');
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orderId = document.getElementById('search_order_id').value;
            if (!orderId) {
                alert('Vui lòng nhập ID đơn hàng!');
                return;
            }
            showOrderDetail(orderId);
        });

        const form = document.getElementById('orderForm');
        const cancelEdit = document.getElementById('cancelEdit');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const order = {
                OrderDate: document.getElementById('order_date').value,
                Phone_number: document.getElementById('phone_number').value,
                Quantity: parseInt(document.getElementById('quantity').value)
            };

            try {
                let response;
                if (editingOrderId) {
                    response = await fetch(`http://127.0.0.1:8000/orders/${editingOrderId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(order)
                    });
                } else {
                    response = await fetch('http://127.0.0.1:8000/orders/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(order)
                    });
                }

                if (response.ok) {
                    loadOrders();
                    form.reset();
                    cancelEdit.style.display = 'none';
                    editingOrderId = null;
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi lưu đơn hàng: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        });

        cancelEdit.addEventListener('click', () => {
            form.reset();
            cancelEdit.style.display = 'none';
            editingOrderId = null;
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/orders/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const orders = await response.json();
            const tbody = document.querySelector('#orderTable tbody');
            tbody.innerHTML = '';
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Không có đơn hàng nào</td></tr>';
            } else {
                orders.forEach(order => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><a href="#" class="order-detail-link" data-id="${order.OrderID}">${order.OrderID}</a></td>
                        <td>${order.OrderDate}</td>
                        <td>${order.Phone_number || ''}</td>
                        <td>${order.Quantity || ''}</td>
                        <td>${order.TotalAmount ? order.TotalAmount.toLocaleString() : '0'}</td>
                        <td>
                            <button onclick="editOrder(${order.OrderID})">Sửa</button>
                            <button onclick="deleteOrder(${order.OrderID})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                // Sau khi render xong bảng:
                document.querySelectorAll('.order-detail-link').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const orderId = this.dataset.id;
                        showOrderDetail(orderId);
                    });
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách đơn hàng: ' + error.message);
        }
    }

    // Hàm hiển thị chi tiết đơn hàng
    async function showOrderDetail(orderId) {
        mainContent.innerHTML = `<h2>Chi tiết đơn hàng #${orderId}</h2><div id="orderDetailInfo">Đang tải...</div>`;
        try {
            // Lấy thông tin đơn hàng
            const orderRes = await fetch(`http://127.0.0.1:8000/orders/${orderId}`);
            const order = await orderRes.json();
            // Lấy chi tiết đơn hàng
            const detailRes = await fetch(`http://127.0.0.1:8000/orderdetails/?order_id=${orderId}`);
            const details = await detailRes.json();
            let html = `
                <div><b>Ngày đặt:</b> ${order.OrderDate}</div>
                <div><b>Số điện thoại khách hàng:</b> ${order.Phone_number || ''}</div>
                <div><b>Tổng số lượng:</b> ${order.Quantity || ''}</div>
                <div><b>Tổng số tiền:</b> ${order.TotalAmount ? order.TotalAmount.toLocaleString() : '0'}</div>
                <h3>Sản phẩm đã mua:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            details.forEach(item => {
                html += `
                    <tr>
                        <td>${item.ProductName || item.productName || ''}</td>
                        <td>${item.Quantity}</td>
                        <td>${item.UnitPrice.toLocaleString()}</td>
                        <td>${item.TotalAmount.toLocaleString()}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            document.getElementById('orderDetailInfo').innerHTML = html;
        } catch (error) {
            document.getElementById('orderDetailInfo').innerText = 'Lỗi khi tải chi tiết đơn hàng!';
        }
    }

    window.editOrder = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/orders/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const order = await response.json();
            document.getElementById('order_date').value = order.OrderDate;
            document.getElementById('phone_number').value = order.Phone_number;
            document.getElementById('quantity').value = order.Quantity || '';
            document.getElementById('cancelEdit').style.display = 'inline';
            editingOrderId = id;
        } catch (error) {
            alert('Lỗi khi tải thông tin đơn hàng: ' + error.message);
        }
    };

    window.deleteOrder = async (id) => {
        if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/orders/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadOrders();
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi xóa đơn hàng: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    // Products
    async function loadProducts() {
        mainContent.innerHTML = `
            <h2>Quản lý Sản phẩm</h2>
            <table id="productTable">
                <thead>
                    <tr>
                        <th>ID Sản phẩm</th>
                        <th>Tên sản phẩm</th>
                        <th>Thương hiệu</th>
                        <th>Kích thước</th>
                        <th>Giá nhập</th>
                        <th>Giá bán</th>
                        <th>Số lượng</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Thêm/Sửa Sản phẩm</h3>
                <form id="productForm">
                    <label>Tên sản phẩm:</label><input type="text" id="product_name" required>
                    <label>Thương hiệu:</label><input type="text" id="product_brand" required>
                    <label>Kích thước:</label><input type="text" id="size" required>
                    <label>Giá nhập:</label><input type="number" step="0.01" id="import_price" required>
                    <label>Giá bán:</label><input type="number" step="0.01" id="sale_price" required>
                    <label>Số lượng:</label><input type="number" id="quantity" required>
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
        `;

        const form = document.getElementById('productForm');
        const cancelEdit = document.getElementById('cancelEdit');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const perfume = {
                ProductName: document.getElementById('product_name').value,
                Product_brand: document.getElementById('product_brand').value,
                size: document.getElementById('size').value,
                ImportPrice: parseFloat(document.getElementById('import_price').value),
                SalePrice: parseFloat(document.getElementById('sale_price').value),
                Quantity: parseInt(document.getElementById('quantity').value)
            };

            try {
                let response;
                if (editingProductId) {
                    response = await fetch(`http://127.0.0.1:8000/perfume/${editingProductId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(perfume)
                    });
                } else {
                    response = await fetch('http://127.0.0.1:8000/perfume/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(perfume)
                    });
                }

                if (response.ok) {
                    loadProducts();
                    form.reset();
                    cancelEdit.style.display = 'none';
                    editingProductId = null;
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi lưu sản phẩm: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        });

        cancelEdit.addEventListener('click', () => {
            form.reset();
            cancelEdit.style.display = 'none';
            editingProductId = null;
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/perfume/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const perfumes = await response.json();
            const tbody = document.querySelector('#productTable tbody');
            tbody.innerHTML = '';
            if (perfumes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">Không có sản phẩm nào</td></tr>';
            } else {
                perfumes.forEach(perfume => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${perfume.Product_id}</td>
                        <td>${perfume.ProductName}</td>
                        <td>${perfume.Product_brand}</td>
                        <td>${perfume.size}</td>
                        <td>${perfume.ImportPrice}</td>
                        <td>${perfume.SalePrice}</td>
                        <td>${perfume.Quantity || ''}</td>
                        <td>
                            <button onclick="editProduct(${perfume.Product_id})">Sửa</button>
                            <button onclick="deleteProduct(${perfume.Product_id})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách sản phẩm: ' + error.message);
        }
    }

    window.editProduct = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/perfume/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const perfume = await response.json();
            document.getElementById('product_name').value = perfume.ProductName;
            document.getElementById('product_brand').value = perfume.Product_brand;
            document.getElementById('size').value = perfume.size;
            document.getElementById('import_price').value = perfume.ImportPrice;
            document.getElementById('sale_price').value = perfume.SalePrice;
            document.getElementById('quantity').value = perfume.Quantity || '';
            document.getElementById('cancelEdit').style.display = 'inline';
            editingProductId = id;
        } catch (error) {
            alert('Lỗi khi tải thông tin sản phẩm: ' + error.message);
        }
    };

    window.deleteProduct = async (id) => {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/perfume/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadProducts();
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi xóa sản phẩm: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    // Employees
    async function loadEmployees() {
        mainContent.innerHTML = `
            <h2>Quản lý Nhân viên</h2>
            <table id="employeeTable">
                <thead>
                    <tr>
                        <th>ID Nhân viên</th>
                        <th>Tên</th>
                        <th>Vị trí</th>
                        <th>ID Kho</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Thêm/Sửa Nhân viên</h3>
                <form id="employeeForm">
                    <label>Tên:</label><input type="text" id="employees_name" required>
                    <label>Vị trí:</label><input type="text" id="position" required>
                    <label>ID Kho:</label><input type="number" id="inventory_id" required>
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
        `;

        const form = document.getElementById('employeeForm');
        const cancelEdit = document.getElementById('cancelEdit');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const employee = {
                employees_name: document.getElementById('employees_name').value,
                position: document.getElementById('position').value,
                Inventory_id: parseInt(document.getElementById('inventory_id').value)
            };

            try {
                let response;
                if (editingEmployeeId) {
                    response = await fetch(`http://127.0.0.1:8000/employees/${editingEmployeeId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(employee)
                    });
                } else {
                    response = await fetch('http://127.0.0.1:8000/employees/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(employee)
                    });
                }

                if (response.ok) {
                    loadEmployees();
                    form.reset();
                    cancelEdit.style.display = 'none';
                    editingEmployeeId = null;
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi lưu nhân viên: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        });

        cancelEdit.addEventListener('click', () => {
            form.reset();
            cancelEdit.style.display = 'none';
            editingEmployeeId = null;
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/employees/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();
            const tbody = document.querySelector('#employeeTable tbody');
            tbody.innerHTML = '';
            if (employees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Không có nhân viên nào</td></tr>';
            } else {
                employees.forEach(employee => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${employee.Employees_id}</td>
                        <td>${employee.employees_name}</td>
                        <td>${employee.position}</td>
                        <td>${employee.Inventory_id}</td>
                        <td>
                            <button onclick="editEmployee(${employee.Employees_id})">Sửa</button>
                            <button onclick="deleteEmployee(${employee.Employees_id})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách nhân viên: ' + error.message);
        }
    }

    window.editEmployee = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/employees/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employee = await response.json();
            document.getElementById('employees_name').value = employee.employees_name;
            document.getElementById('position').value = employee.position;
            document.getElementById('inventory_id').value = employee.Inventory_id;
            document.getElementById('cancelEdit').style.display = 'inline';
            editingEmployeeId = id;
        } catch (error) {
            alert('Lỗi khi tải thông tin nhân viên: ' + error.message);
        }
    };

    window.deleteEmployee = async (id) => {
        if (confirm('Bạn có chắc muốn xóa nhân viên này?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/employees/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadEmployees();
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi xóa nhân viên: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    // Suppliers
    async function loadSuppliers() {
        mainContent.innerHTML = `
            <h2>Quản lý Nhà cung cấp</h2>
            <table id="supplierTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên nhà cung cấp</th>
                        <th>ID Sản phẩm</th>
                        <th>Thông tin liên hệ</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Thêm/Sửa Nhà cung cấp</h3>
                <form id="supplierForm">
                    <label>Tên nhà cung cấp:</label><input type="text" id="supplier_name" required>
                    <label>ID Sản phẩm:</label><input type="number" id="product_id" required>
                    <label>Thông tin liên hệ:</label><input type="text" id="contact_info" required>
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
        `;

        let editingSupplierId = null;
        const form = document.getElementById('supplierForm');
        const cancelEdit = document.getElementById('cancelEdit');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const supplier = {
                supplier_name: document.getElementById('supplier_name').value,
                Product_id: parseInt(document.getElementById('product_id').value),
                Contact_info: document.getElementById('contact_info').value
            };
            try {
                let response;
                if (editingSupplierId) {
                    response = await fetch(`http://127.0.0.1:8000/suppliers/${editingSupplierId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(supplier)
                    });
                } else {
                    response = await fetch('http://127.0.0.1:8000/suppliers/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(supplier)
                    });
                }
                if (response.ok) {
                    loadSuppliers();
                    form.reset();
                    cancelEdit.style.display = 'none';
                    editingSupplierId = null;
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi lưu nhà cung cấp: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        });

        cancelEdit.addEventListener('click', () => {
            form.reset();
            cancelEdit.style.display = 'none';
            editingSupplierId = null;
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/suppliers/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const suppliers = await response.json();
            const tbody = document.querySelector('#supplierTable tbody');
            tbody.innerHTML = '';
            if (suppliers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">Không có nhà cung cấp nào</td></tr>';
            } else {
                suppliers.forEach(supplier => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${supplier.supplier_ID}</td>
                        <td>${supplier.supplier_name}</td>
                        <td>${supplier.Product_id}</td>
                        <td>${supplier.Contact_info}</td>
                        <td>
                            <button onclick="editSupplier(${supplier.supplier_ID})">Sửa</button>
                            <button onclick="deleteSupplier(${supplier.supplier_ID})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách nhà cung cấp: ' + error.message);
        }
    }

    window.editSupplier = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/suppliers/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const supplier = await response.json();
            document.getElementById('supplier_name').value = supplier.supplier_name;
            document.getElementById('product_id').value = supplier.Product_id;
            document.getElementById('contact_info').value = supplier.Contact_info;
            document.getElementById('cancelEdit').style.display = 'inline';
            editingSupplierId = id;
        } catch (error) {
            alert('Lỗi khi tải thông tin nhà cung cấp: ' + error.message);
        }
    };

    window.deleteSupplier = async (id) => {
        if (confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/suppliers/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadSuppliers();
                } else {
                    const errorText = await response.text();
                    alert(`Lỗi khi xóa nhà cung cấp: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    // Statistics
    async function loadStatistics() {
        mainContent.innerHTML = `
            <h2>Thống kê</h2>
            <div>
                <p><strong>Tổng số khách hàng:</strong> <span id="total_customers"></span></p>
                <p><strong>Tổng số đơn hàng:</strong> <span id="total_orders"></span></p>
                <p><strong>Tổng doanh thu:</strong> <span id="total_revenue"></span></p>
                <p><strong>Tổng số sản phẩm trong kho:</strong> <span id="total_inventory"></span></p>
                <canvas id="statsChart"></canvas>
            </div>
        `;

        try {
            const response = await fetch('http://127.0.0.1:8000/statistics/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stats = await response.json();
            document.getElementById('total_customers').textContent = stats.total_customers;
            document.getElementById('total_orders').textContent = stats.total_orders;
            document.getElementById('total_revenue').textContent = stats.total_revenue.toFixed(2);
            document.getElementById('total_inventory').textContent = stats.total_inventory;

            // Tạo biểu đồ
            const ctx = document.getElementById('statsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Tổng khách hàng", "Tổng đơn hàng", "Doanh thu", "Tồn kho"],
                    datasets: [{
                        label: 'Thống kê',
                        data: [
                            stats.total_customers,
                            stats.total_orders,
                            stats.total_revenue,
                            stats.total_inventory
                        ],
                        backgroundColor: [
                            "rgba(75, 192, 192, 0.6)",
                            "rgba(54, 162, 235, 0.6)",
                            "rgba(255, 99, 132, 0.6)",
                            "rgba(255, 206, 86, 0.6)"
                        ],
                        borderColor: [
                            "rgba(75, 192, 192, 1)",
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 99, 132, 1)",
                            "rgba(255, 206, 86, 1)"
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            alert('Lỗi khi tải thống kê: ' + error.message);
        }
    }
});
