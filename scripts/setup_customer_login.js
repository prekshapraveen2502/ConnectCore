const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'StrongPassword123!',
    server: 'localhost',
    database: 'TelecomDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function setupCustomerLogin() {
    try {
        await sql.connect(config);
        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        console.log('Connected to database...');

        // 1. Create CUSTOMER_LOGIN Table
        console.log('Creating CUSTOMER_LOGIN table...');
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CUSTOMER_LOGIN' AND xtype='U')
            BEGIN
                CREATE TABLE CUSTOMER_LOGIN (
                    LoginID INT IDENTITY(1,1) PRIMARY KEY,
                    CustomerID INT NOT NULL,
                    Username VARCHAR(50) UNIQUE NOT NULL,
                    Password VARCHAR(255) NOT NULL,
                    FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID) ON DELETE CASCADE
                );
                PRINT 'CUSTOMER_LOGIN table created.';
            END
            ELSE
            BEGIN
                PRINT 'CUSTOMER_LOGIN table already exists.';
            END
        `);

        // 2. Create Stored Procedure
        console.log('Creating sp_ValidateCustomerLogin...');
        await pool.query(`
            CREATE OR ALTER PROCEDURE sp_ValidateCustomerLogin
                @Username VARCHAR(50),
                @Password VARCHAR(255)
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT CustomerID, 1 as IsValid 
                FROM CUSTOMER_LOGIN 
                WHERE Username = @Username AND Password = @Password;
            END
        `);

        // 3. Migrate Existing Customers
        console.log('Migrating existing customers...');
        // Insert login for customers who don't have one
        // Username = Name (no spaces) + ID, Password = 'password123'
        await pool.query(`
            INSERT INTO CUSTOMER_LOGIN (CustomerID, Username, Password)
            SELECT CustomerID, REPLACE(CustomerName, ' ', '') + CAST(CustomerID AS VARCHAR), 'password123'
            FROM CUSTOMER c
            WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER_LOGIN cl WHERE cl.CustomerID = c.CustomerID)
            AND CustomerName IS NOT NULL AND CustomerName <> ''
            AND NOT EXISTS (SELECT 1 FROM CUSTOMER_LOGIN cl WHERE cl.Username = REPLACE(c.CustomerName, ' ', '') + CAST(c.CustomerID AS VARCHAR));
        `);

        console.log('Migration complete.');

        await pool.close();
        console.log('Setup successful!');

    } catch (err) {
        console.error('Error:', err);
    }
}

setupCustomerLogin();
