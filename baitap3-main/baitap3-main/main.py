from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi import Query
import mysql.connector
from mysql.connector import Error
from datetime import date

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "doanhdeptrai33@",
    "database": "baitapnhom3"
}

def get_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print("Lỗi khi kết nối với MySQL:", e)
        return None

class CustomerCreate(BaseModel):
    First_name: str
    Last_name: str
    name: str = None
    Phone_number: str = None
    email: str = None
    address: str = None

class CustomerOut(CustomerCreate):
    Customer_id: int

class OrderCreate(BaseModel):
    OrderDate: date
    Customer_id: int
    Quantity: int = 0
    TotalAmount: float = 0

class OrderOut(OrderCreate):
    OrderID: int
    Phone_number: str = None

class PerfumeCreate(BaseModel):
    ProductName: str
    Product_brand: str
    size: str
    ImportPrice: float
    SalePrice: float
    Quantity: int

class PerfumeOut(PerfumeCreate):
    Product_id: int

class EmployeeCreate(BaseModel):
    employees_name: str
    position: str
    Inventory_id: int

class EmployeeOut(EmployeeCreate):
    Employees_id: int

class OrderDetailCreate(BaseModel):
    OrderID: int
    Product_id: int
    Quantity: int
    UnitPrice: float
    TotalAmount: float
    OrderStatus: str = None

class OrderDetailOut(OrderDetailCreate):
    OrderDetailID: int
    ProductName: str = None

class SupplierCreate(BaseModel):
    supplier_name: str
    Product_id: int
    Contact_info: str

class SupplierOut(SupplierCreate):
    supplier_ID: int

@app.get("/")
def root():
    return {"message": "FastAPI đang hoạt động"}

@app.get("/api")
def api_root():
    return {"message": "Chào mừng đến với API của bạn"}

@app.post("/customer/", response_model=CustomerOut)
def create_customer(customer: CustomerCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO baitapnhom3.Customer (First_name, Last_name, Phone_number, email, address)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            customer.First_name,
            customer.Last_name,
            customer.Phone_number,
            customer.email,
            customer.address
        ))
        conn.commit()
        customer_id = cursor.lastrowid
        return CustomerOut(Customer_id=customer_id, **customer.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/customer/", response_model=List[CustomerOut])
def get_customers(phone: str = None):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        if phone:
            cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Phone_number = %s", (phone,))
        else:
            cursor.execute("SELECT * FROM baitapnhom3.Customer")
        rows = cursor.fetchall()
        
        for row in rows:
            if 'name' not in row or row['name'] is None:
                row['name'] = ""
        return rows
    finally:
        cursor.close()
        conn.close()

@app.put("/customer/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, customer: CustomerCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
        cursor.execute("""
            UPDATE baitapnhom3.Customer SET First_name=%s, Last_name=%s, Phone_number=%s, email=%s, address=%s
            WHERE Customer_id=%s
        """, (
            customer.First_name,
            customer.Last_name,
            customer.Phone_number,
            customer.email,
            customer.address,
            customer_id
        ))
        conn.commit()
        return CustomerOut(Customer_id=customer_id, **customer.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/customer/{customer_id}", response_model=dict)
def delete_customer(customer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Customer_id = %s", (customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
        cursor.execute("DELETE FROM baitapnhom3.Customer WHERE Customer_id = %s", (customer_id,))
        conn.commit()
        return {"message": "Xóa khách hàng thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/customer/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Customer_id = %s", (customer_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
        return row
    finally:
        cursor.close()
        conn.close()

@app.post("/orders/", response_model=OrderOut)
def create_order(order: OrderCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Customer_id = %s", (order.Customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        cursor.execute(
            "INSERT INTO baitapnhom3.Orders (OrderDate, Customer_id, Quantity, TotalAmount) VALUES (%s, %s, %s, %s)",
            (order.OrderDate, order.Customer_id, order.Quantity, order.TotalAmount)
        )
        conn.commit()
        order_id = cursor.lastrowid
        return OrderOut(OrderID=order_id, **order.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/orders/{order_id}",response_model=OrderOut)
def get_order(order_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.*, c.Phone_number
            FROM baitapnhom3.Orders o
            LEFT JOIN baitapnhom3.Customer c ON o.Customer_id = c.Customer_id
            WHERE o.OrderID = %s
        """, (order_id,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        if order['OrderDate']:
            order['OrderDate'] = order['OrderDate'].isoformat()
        else:
            order['OrderDate'] = None
        return order
    finally:
        cursor.close()
        conn.close()

@app.get("/orders/", response_model=List[OrderOut])
def get_orders():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.*, c.Phone_number
            FROM baitapnhom3.Orders o
            LEFT JOIN baitapnhom3.Customer c ON o.Customer_id = c.Customer_id
        """)
        orders = cursor.fetchall()
        for order in orders:
            if order['OrderDate']:
                order['OrderDate'] = order['OrderDate'].isoformat()
            else:
                order['OrderDate'] = None
        return orders
    finally:
        cursor.close()
        conn.close()

@app.put("/orders/{order_id}", response_model=OrderOut)
def update_order(order_id: int, order: OrderCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Orders WHERE OrderID = %s", (order_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        cursor.execute("SELECT * FROM baitapnhom3.Customer WHERE Customer_id = %s", (order.Customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        cursor.execute(
            "UPDATE baitapnhom3.Orders SET OrderDate=%s, Customer_id=%s WHERE OrderID=%s",
            (order.OrderDate, order.Customer_id, order_id)
        )
        conn.commit()
        return OrderOut(OrderID=order_id, **order.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/orders/{order_id}", response_model=dict)
def delete_order(order_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Orders WHERE OrderID = %s", (order_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        cursor.execute("DELETE FROM baitapnhom3.Orders WHERE OrderID = %s", (order_id,))
        conn.commit()
        return {"message": "Xóa đơn hàng thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.post("/perfume/", response_model=PerfumeOut)
def create_perfume(perfume: PerfumeCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO baitapnhom3.Perfume (ProductName, Product_brand, size, ImportPrice, SalePrice, Quantity)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            perfume.ProductName,
            perfume.Product_brand,
            perfume.size,
            perfume.ImportPrice,
            perfume.SalePrice,
            perfume.Quantity
        ))
        conn.commit()
        product_id = cursor.lastrowid
        return PerfumeOut(Product_id=product_id, **perfume.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/perfume/", response_model=List[PerfumeOut])
def get_perfumes():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Perfume")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@app.put("/perfume/{product_id}", response_model=PerfumeOut)
def update_perfume(product_id: int, perfume: PerfumeCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Perfume WHERE Product_id = %s", (product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
        cursor.execute("""
            UPDATE baitapnhom3.Perfume SET ProductName=%s, Product_brand=%s, size=%s, ImportPrice=%s, SalePrice=%s, Quantity=%s
            WHERE Product_id=%s
        """, (
            perfume.ProductName,
            perfume.Product_brand,
            perfume.size,
            perfume.ImportPrice,
            perfume.SalePrice,
            perfume.Quantity,
            product_id
        ))
        conn.commit()
        return PerfumeOut(Product_id=product_id, **perfume.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/perfume/{product_id}", response_model=PerfumeOut)
def get_perfume(product_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Perfume WHERE Product_id = %s", (product_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
        return row
    finally:
        cursor.close()
        conn.close()

@app.delete("/perfume/{product_id}")
def delete_perfume(product_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM baitapnhom3.Inventory WHERE ProductID = %s", (product_id,))
        if cursor.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Không thể xóa sản phẩm vì có dữ liệu liên quan trong kho. Vui lòng xóa hoặc cập nhật bảng Inventory trước.")
        cursor.execute("DELETE FROM baitapnhom3.Perfume WHERE Product_id = %s", (product_id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm để xóa")
        return {"message": "Xóa sản phẩm thành công"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {err}")
    finally:
        cursor.close()
        conn.close()

@app.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Employees WHERE Employees_id = %s", (employee_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        return row
    finally:
        cursor.close()
        conn.close()

@app.post("/employees/", response_model=EmployeeOut)
def create_employee(employee: EmployeeCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        
        cursor.execute("SELECT Inventory_id FROM baitapnhom3.Inventory WHERE Inventory_id = %s", (employee.Inventory_id,))
        inventory_id = employee.Inventory_id
        if cursor.fetchone() is None:
            
            cursor.execute(
                "INSERT INTO baitapnhom3.Inventory (ProductID, quantity, Last_update) VALUES (NULL, 0, CURDATE())"
            )
            conn.commit()
            inventory_id = cursor.lastrowid  
        cursor.execute("""
            INSERT INTO baitapnhom3.Employees (employees_name, position, Inventory_id)
            VALUES (%s, %s, %s)
        """, (
            employee.employees_name,
            employee.position,
            inventory_id
        ))
        conn.commit()
        employee_id = cursor.lastrowid
        return EmployeeOut(Employees_id=employee_id, employees_name=employee.employees_name, position=employee.position, Inventory_id=inventory_id)
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/employees/", response_model=List[EmployeeOut])
def get_employees():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Employees")
        employees = cursor.fetchall()
        return employees if employees else []
    finally:
        cursor.close()
        conn.close()

@app.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, employee: EmployeeCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Employees WHERE Employees_id = %s", (employee_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        cursor.execute("SELECT Inventory_id FROM baitapnhom3.Inventory WHERE Inventory_id = %s", (employee.Inventory_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Kho không tồn tại")
        cursor.execute("""
            UPDATE baitapnhom3.Employees SET employees_name=%s, position=%s, Inventory_id=%s
            WHERE Employees_id=%s
        """, (
            employee.employees_name,
            employee.position,
            employee.Inventory_id,
            employee_id
        ))
        conn.commit()
        return EmployeeOut(Employees_id=employee_id, **employee.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/employees/{employee_id}", response_model=dict)
def delete_employee(employee_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.Employees WHERE Employees_id = %s", (employee_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        cursor.execute("DELETE FROM baitapnhom3.Employees WHERE Employees_id = %s", (employee_id,))
        conn.commit()
        return {"message": "Xóa nhân viên thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.post("/orderdetails/", response_model=OrderDetailOut)
def create_order_detail(order_detail: OrderDetailCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO baitapnhom3.OrderDetails (OrderID, Product_id, Quantity, UnitPrice, TotalAmount, OrderStatus)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            order_detail.OrderID,
            order_detail.Product_id,
            order_detail.Quantity,
            order_detail.UnitPrice,
            order_detail.TotalAmount,
            order_detail.OrderStatus
        ))
        conn.commit()
        order_detail_id = cursor.lastrowid
        return OrderDetailOut(OrderDetailID=order_detail_id, **order_detail.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()


@app.get("/orderdetails/", response_model=List[OrderDetailOut])
def get_order_details(order_id: int = Query(None)):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT od.OrderDetailID, od.OrderID, od.Product_id, od.Quantity, od.UnitPrice, od.TotalAmount, od.OrderStatus, p.ProductName
            FROM baitapnhom3.OrderDetails od
            LEFT JOIN baitapnhom3.Perfume p ON od.Product_id = p.Product_id
        """
        if order_id:
            sql += " WHERE od.OrderID = %s"
            cursor.execute(sql, (order_id,))
        else:
            cursor.execute(sql)
        rows = cursor.fetchall()
        for row in rows:
            if row.get('OrderStatus') is None:
                row['OrderStatus'] = ""
            if row.get('ProductName') is None:
                row['ProductName'] = ""
        return rows
    finally:
        cursor.close()
        conn.close()
        
@app.get("/orderdetails/{order_detail_id}", response_model=OrderDetailOut)
def get_order_detail(order_detail_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.OrderDetails WHERE OrderDetailID = %s", (order_detail_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy chi tiết đơn hàng")
        return row
    finally:
        cursor.close()
        conn.close()

@app.put("/orderdetails/{order_detail_id}", response_model=OrderDetailOut)
def update_order_detail(order_detail_id: int, order_detail: OrderDetailCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.OrderDetails WHERE OrderDetailID = %s", (order_detail_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy chi tiết đơn hàng")
        cursor.execute("""
            UPDATE baitapnhom3.OrderDetails
            SET OrderID=%s, Product_id=%s, Quantity=%s, UnitPrice=%s, TotalAmount=%s, OrderStatus=%s
            WHERE OrderDetailID=%s
        """, (
            order_detail.OrderID,
            order_detail.Product_id,
            order_detail.Quantity,
            order_detail.UnitPrice,
            order_detail.TotalAmount,
            order_detail.OrderStatus,
            order_detail_id
        ))
        conn.commit()
        return OrderDetailOut(OrderDetailID=order_detail_id, **order_detail.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/orderdetails/{order_detail_id}", response_model=dict)
def delete_order_detail(order_detail_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.OrderDetails WHERE OrderDetailID = %s", (order_detail_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy chi tiết đơn hàng")
        cursor.execute("DELETE FROM baitapnhom3.OrderDetails WHERE OrderDetailID = %s", (order_detail_id,))
        conn.commit()
        return {"message": "Xóa chi tiết đơn hàng thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/statistics/")
def get_statistics():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) as total_customers FROM baitapnhom3.Customer")
        total_customers = cursor.fetchone()['total_customers']
        cursor.execute("SELECT COUNT(*) as total_orders FROM baitapnhom3.Orders")
        total_orders = cursor.fetchone()['total_orders']
        cursor.execute("SELECT SUM(TotalAmount) as total_revenue FROM baitapnhom3.OrderDetails")
        total_revenue = cursor.fetchone()['total_revenue'] or 0
        cursor.execute("SELECT SUM(quantity) as total_inventory FROM baitapnhom3.Inventory")
        total_inventory = cursor.fetchone()['total_inventory'] or 0

        return {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "total_inventory": total_inventory
        }
    finally:
        cursor.close()
        conn.close()

@app.get("/suppliers/", response_model=List[SupplierOut])
def get_suppliers():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom3.suppliers")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

@app.post("/suppliers/", response_model=SupplierOut)
def create_supplier(supplier: SupplierCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO baitapnhom3.suppliers (supplier_name, Product_id, Contact_info)
            VALUES (%s, %s, %s)
        """, (supplier.supplier_name, supplier.Product_id, supplier.Contact_info))
        conn.commit()
        supplier_id = cursor.lastrowid
        return SupplierOut(supplier_ID=supplier_id, **supplier.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.put("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, supplier: SupplierCreate):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.suppliers WHERE supplier_ID = %s", (supplier_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
        cursor.execute("""
            UPDATE baitapnhom3.suppliers SET supplier_name=%s, Product_id=%s, Contact_info=%s
            WHERE supplier_ID=%s
        """, (supplier.supplier_name, supplier.Product_id, supplier.Contact_info, supplier_id))
        conn.commit()
        return SupplierOut(supplier_ID=supplier_id, **supplier.dict())
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/suppliers/{supplier_id}", response_model=dict)
def delete_supplier(supplier_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM baitapnhom3.suppliers WHERE supplier_ID = %s", (supplier_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
        cursor.execute("DELETE FROM baitapnhom3.suppliers WHERE supplier_ID = %s", (supplier_id,))
        conn.commit()
        return {"message": "Xóa nhà cung cấp thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()