CREATE DATABASE baitapnhom1;
USE baitapnhom1;
CREATE TABLE Customer (
    Customer_id INT PRIMARY KEY,
    First_name VARCHAR(50),
    Last_name VARCHAR(50),
    name VARCHAR(100),
    Phone_number VARCHAR(15),
    email VARCHAR(100),
    address VARCHAR(255)
);
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    OrderDate DATE,
    Customer_id INT,
    FOREIGN KEY (Customer_id) REFERENCES Customer(Customer_id)
);
CREATE TABLE Perfume (
    Product_id INT PRIMARY KEY,
    ProductName VARCHAR(100),
    Product_brand VARCHAR(100),
    size VARCHAR(50),
    price DECIMAL(10, 2)
);

CREATE TABLE OrderDetails (
    OrderDetailID INT PRIMARY KEY,
    OrderID INT,
    Product_id INT,
    Quantity INT,
    price DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    TotalAmount DECIMAL(10, 2),
    OrderStatus VARCHAR(50),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (Product_id) REFERENCES Perfume(Product_id)
);
CREATE TABLE suppliers(
	supplier_ID INT PRIMARY KEY,
    supplier_name VARCHAR(100),
    Product_id INT,
    Contact_infor VARCHAR(100),
    FOREIGN KEY (Product_id) REFERENCES Perfume(Product_id)
);
CREATE TABLE Inventory(
    Inventory_id INT PRIMARY KEY,
    ProductID INT,
    quantity INT,
    Last_update DATE,
    FOREIGN KEY (ProductID) REFERENCES Perfume(Product_id)
);
CREATE TABLE Employees(
    Employees_id INT PRIMARY KEY,
    employees_name VARCHAR(100),
    position VARCHAR(100),
    Inventory_id INT,
    FOREIGN KEY (Inventory_id) REFERENCES Inventory(Inventory_id)
);
