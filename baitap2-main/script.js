document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const mainContent = document.querySelector('.main-content');

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
        `;

        const form = document.getElementById('customerForm');
        const cancelEdit = document.getElementById('cancelEdit');
        let editingId = null;

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
                if (editingId) {
                    response = await fetch(`http://127.0.0.1:8000/customer/${editingId}`, {
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
                    editingId = null;
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
            editingId = null;
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
            window.editingId = id;
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
                        <th>ID Khách hàng</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="form-container">
                <h3>Thêm/Sửa Đơn hàng</h3>
                <form id="orderForm">
                    <label>Ngày đặt:</label><input type="date" id="order_date" required>
                    <label>ID Khách hàng:</label><input type="number" id="customer_id" required>
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
        `;

        const form = document.getElementById('orderForm');
        const cancelEdit = document.getElementById('cancelEdit');
        let editingId = null;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const order = {
                OrderDate: document.getElementById('order_date').value,
                Customer_id: parseInt(document.getElementById('customer_id').value)
            };

            try {
                let response;
                if (editingId) {
                    response = await fetch(`http://127.0.0.1:8000/orders/${editingId}`, {
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
                    editingId = null;
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
            editingId = null;
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
                tbody.innerHTML = '<tr><td colspan="4">Không có đơn hàng nào</td></tr>';
            } else {
                orders.forEach(order => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${order.OrderID}</td>
                        <td>${order.OrderDate}</td>
                        <td>${order.Customer_id}</td>
                        <td>
                            <button onclick="editOrder(${order.OrderID})">Sửa</button>
                            <button onclick="deleteOrder(${order.OrderID})">Xóa</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách đơn hàng: ' + error.message);
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
            document.getElementById('customer_id').value = order.Customer_id;
            document.getElementById('cancelEdit').style.display = 'inline';
            window.editingId = id;
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
                        <th>Giá</th>
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
                    <label>Giá:</label><input type="number" step="0.01" id="price" required>
                    <button type="submit">Lưu</button>
                    <button type="button" id="cancelEdit" style="display:none;">Hủy</button>
                </form>
            </div>
        `;

        const form = document.getElementById('productForm');
        const cancelEdit = document.getElementById('cancelEdit');
        let editingId = null;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const perfume = {
                ProductName: document.getElementById('product_name').value,
                Product_brand: document.getElementById('product_brand').value,
                size: document.getElementById('size').value,
                price: parseFloat(document.getElementById('price').value)
            };

            try {
                let response;
                if (editingId) {
                    response = await fetch(`http://127.0.0.1:8000/perfume/${editingId}`, {
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
                    editingId = null;
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
            editingId = null;
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
                tbody.innerHTML = '<tr><td colspan="6">Không có sản phẩm nào</td></tr>';
            } else {
                perfumes.forEach(perfume => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${perfume.Product_id}</td>
                        <td>${perfume.ProductName}</td>
                        <td>${perfume.Product_brand}</td>
                        <td>${perfume.size}</td>
                        <td>${perfume.price}</td>
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
            document.getElementById('price').value = perfume.price;
            document.getElementById('cancelEdit').style.display = 'inline';
            window.editingId = id;
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
        let editingId = null;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const employee = {
                employees_name: document.getElementById('employees_name').value,
                position: document.getElementById('position').value,
                Inventory_id: parseInt(document.getElementById('inventory_id').value)
            };

            try {
                let response;
                if (editingId) {
                    response = await fetch(`http://127.0.0.1:8000/employees/${editingId}`, {
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
                    editingId = null;
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
            editingId = null;
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
            window.editingId = id;
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

    // Statistics
    async function loadStatistics() {
        mainContent.innerHTML = `
            <h2>Thống kê</h2>
            <div id="statistics">
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