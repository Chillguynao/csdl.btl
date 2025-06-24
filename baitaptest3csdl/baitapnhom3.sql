CREATE DATABASE baitapnhom3;
USE baitapnhom3;

CREATE TABLE Customer (
    Customer_id INT AUTO_INCREMENT PRIMARY KEY,
    First_name VARCHAR(50),
    Last_name VARCHAR(50),
    Phone_number VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    address VARCHAR(255)
);

CREATE TABLE Orders (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    OrderDate DATE,
    Customer_id INT,
    TotalAmount DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (Customer_id) REFERENCES Customer(Customer_id)
);

CREATE TABLE Perfume (
    Product_id INT AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(100),
    Product_brand VARCHAR(100),
    size VARCHAR(50),
    ImportPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
    SalePrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
    Quantity INT CHECK (Quantity >= 0)
);

CREATE TABLE OrderDetails (
    OrderDetailID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT,
    Product_id INT,
    Quantity INT CHECK (Quantity > 0),
    UnitPrice DECIMAL(10, 2),
    TotalAmount DECIMAL(10, 2),
    OrderStatus VARCHAR(50),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (Product_id) REFERENCES Perfume(Product_id)
);

CREATE TABLE suppliers (
    supplier_ID INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100),
    Product_id INT,
    Contact_info VARCHAR(100),
    FOREIGN KEY (Product_id) REFERENCES Perfume(Product_id)
);

CREATE TABLE Inventory (
    Inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    quantity INT CHECK (quantity >= 0),
    Last_update DATE,
    FOREIGN KEY (ProductID) REFERENCES Perfume(Product_id)
);

CREATE TABLE Employees (
    Employees_id INT AUTO_INCREMENT PRIMARY KEY,
    employees_name VARCHAR(100),
    position VARCHAR(100),
    Inventory_id INT,
    FOREIGN KEY (Inventory_id) REFERENCES Inventory(Inventory_id)
);

ALTER TABLE Orders ADD COLUMN Quantity INT DEFAULT 0;