from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import mysql.connector
from mysql.connector import Error
from datetime import date

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "doanhdeptrai33@",
    "database": "baitapnhom1"
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
    name: str
    Phone_number: str = None
    email: str = None
    address: str = None

class CustomerOut(CustomerCreate):
    Customer_id: int

class OrderCreate(BaseModel):
    OrderDate: date
    Customer_id: int

class OrderOut(OrderCreate):
    OrderID: int

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
            INSERT INTO baitapnhom1.Customer (First_name, Last_name, name, Phone_number, email, address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            customer.First_name,
            customer.Last_name,
            customer.name,
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
def get_customers():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom1.Customer")
        return cursor.fetchall()
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
        cursor.execute("SELECT Customer_id FROM baitapnhom1.Customer WHERE Customer_id = %s", (order.Customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

        cursor.execute(
            "INSERT INTO baitapnhom1.Orders (OrderDate, Customer_id) VALUES (%s, %s)",
            (order.OrderDate, order.Customer_id)
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

@app.get("/customer/{customer_id}/orders", response_model=List[OrderOut])
def get_orders(customer_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối DB")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM baitapnhom1.Orders WHERE Customer_id = %s", (customer_id,))
        return cursor.fetchall()
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
        cursor.execute("SELECT * FROM baitapnhom1.Customer WHERE Customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

        cursor.execute("""
            UPDATE baitapnhom1.Customer SET First_name=%s, Last_name=%s, name=%s, Phone_number=%s, email=%s, address=%s
            WHERE Customer_id=%s
        """, (
            customer.First_name,
            customer.Last_name,
            customer.name,
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
        cursor.execute("SELECT * FROM baitapnhom1.Customer WHERE Customer_id = %s", (customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

        cursor.execute("DELETE FROM baitapnhom1.Customer WHERE Customer_id = %s", (customer_id,))
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
        cursor.execute("SELECT * FROM baitapnhom1.Customer WHERE Customer_id = %s", (customer_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
        return row
    finally:
        cursor.close()
        conn.close()

