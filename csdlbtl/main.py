from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
from typing import List
import mysql.connector
from  mysql.connector import Error
from datetime import date

app=FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db_config={
    "host": "localhost",
    "user": "root",              
    "password": "doanhdeptrai33@", 
    "database": "csdlbtl"
}

def get_connection():
    try:
        conn=mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print("Lỗi khi kết nối với Mysql",e)
        return None
    #tao khach hang
class CustomerCreate(BaseModel):
    ma_khach_hang: str
    ten: str
    email: str = None
    so_dien_thoai: str = None
    dia_chi: str = None

class CustomerOut(CustomerCreate):
    id: int

class OrderCreate(BaseModel):
    ngay_dat_hang: date
    customer_id: int
#du lieu don hanghang
class OrderOut(OrderCreate):
    id: int


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
            INSERT INTO customer (ma_khach_hang, ten, email, so_dien_thoai, dia_chi)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            customer.ma_khach_hang,
            customer.ten,
            customer.email,
            customer.so_dien_thoai,
            customer.dia_chi
        ))
        conn.commit()
        customer_id = cursor.lastrowid
        return CustomerOut(id=customer_id, **customer.dict())
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
        cursor.execute("SELECT * FROM csdlbtl.customer")
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
        cursor.execute("SELECT id FROM csdlbtl.customer WHERE id = %s", (order.customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

        cursor.execute(
            "INSERT INTO orders (ngay_dat_hang, customer_id) VALUES (%s, %s)",
            (order.ngay_dat_hang, order.customer_id)
        )
        conn.commit()
        order_id = cursor.lastrowid
        return OrderOut(id=order_id, **order.dict())
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
        cursor.execute("SELECT * FROM csdlbtl.orders WHERE customer_id = %s", (customer_id,))
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
        cursor.execute("SELECT * FROM customer WHERE id = %s", (customer_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

        cursor.execute("""
            UPDATE customer SET ma_khach_hang=%s, ten=%s, email=%s, so_dien_thoai=%s, dia_chi=%s
            WHERE id=%s
        """, (
            customer.ma_khach_hang,
            customer.ten,
            customer.email,
            customer.so_dien_thoai,
            customer.dia_chi,
            customer_id
        ))
        conn.commit()

        cursor.execute("SELECT * FROM customer WHERE id = %s", (customer_id,))
        updated_customer = cursor.fetchone()

        # Nếu dùng cursor không trả về dict, bạn cần lấy từng trường ra hoặc set cursor dictionary=True
        cursor.close()
        conn.close()

        return CustomerOut(
            id=customer_id,
            ma_khach_hang=customer.ma_khach_hang,
            ten=customer.ten,
            email=customer.email,
            so_dien_thoai=customer.so_dien_thoai,
            dia_chi=customer.dia_chi
        )
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
        cursor.execute("SELECT * FROM customer WHERE id = %s", (customer_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

        cursor.execute("DELETE FROM customer WHERE id = %s", (customer_id,))
        conn.commit()
        return {"message": "Xóa khách hàng thành công"}
    except mysql.connector.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Lỗi SQL: {e}")
    finally:
        cursor.close()
        conn.close()
