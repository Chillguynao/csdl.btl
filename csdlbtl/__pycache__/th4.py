import mysql.connector
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="doanhdeptrai33@",   
    database="thuchanh"
)


cursor = conn.cursor()


cursor.execute("SELECT * FROM Customer")


results = cursor.fetchall()


for row in results:
    print(row)


cursor.close()
conn.close()

