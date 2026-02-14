-- =============================================
-- TelecomDB - Database Setup Script
-- Creates the database and all tables
-- =============================================

-- Create database (run this separately if needed)
-- CREATE DATABASE TelecomDB;
-- GO
-- USE TelecomDB;
-- GO

-- =============================================
-- Table: CUSTOMER
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CUSTOMER')
BEGIN
    CREATE TABLE CUSTOMER (
        CustomerID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerName NVARCHAR(100) NOT NULL,
        PhoneNumber VARCHAR(50) NULL,
        DOB DATE NULL,
        Email VARCHAR(255) NULL,
        StartDate DATETIME NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME NULL,
        Status VARCHAR(10) NOT NULL DEFAULT 'Active',
        CustomerName_Encrypted VARBINARY(MAX) NULL,
        PhoneNumber_Encrypted VARBINARY(MAX) NULL
    );
    PRINT 'Created CUSTOMER table';
END
GO

-- =============================================
-- Table: ADMIN_LOGIN
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ADMIN_LOGIN')
BEGIN
    CREATE TABLE ADMIN_LOGIN (
        LoginID INT IDENTITY(1,1) PRIMARY KEY,
        Username VARCHAR(50) NOT NULL,
        Password VARCHAR(255) NOT NULL
    );
    PRINT 'Created ADMIN_LOGIN table';

    -- Insert default admin
    INSERT INTO ADMIN_LOGIN (Username, Password) VALUES ('admin', 'admin123');
    PRINT 'Inserted default admin user';
END
GO

-- =============================================
-- Table: CUSTOMER_LOGIN
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CUSTOMER_LOGIN')
BEGIN
    CREATE TABLE CUSTOMER_LOGIN (
        LoginID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        Username VARCHAR(50) NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Email VARCHAR(255) NULL,
        ResetToken VARCHAR(255) NULL,
        ResetTokenExpiry DATETIME NULL,
        FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID)
    );
    PRINT 'Created CUSTOMER_LOGIN table';
END
GO

-- =============================================
-- Table: PLAN
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PLAN')
BEGIN
    CREATE TABLE [PLAN] (
        PlanID INT IDENTITY(1,1) PRIMARY KEY,
        PlanName VARCHAR(100) NOT NULL,
        DataLimit FLOAT NOT NULL,
        Description VARCHAR(500) NULL,
        PlanType VARCHAR(20) NOT NULL DEFAULT 'Postpaid'
    );
    PRINT 'Created PLAN table';
END
GO

-- =============================================
-- Table: POSTPAID (extends PLAN)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'POSTPAID')
BEGIN
    CREATE TABLE POSTPAID (
        PlanID INT PRIMARY KEY,
        CostPerGB DECIMAL(10,2) NOT NULL,
        CostPerMin DECIMAL(10,2) NOT NULL,
        CostPerMessage DECIMAL(10,2) NOT NULL,
        MonthlyFee DECIMAL(10,2) NOT NULL DEFAULT 0,
        FOREIGN KEY (PlanID) REFERENCES [PLAN](PlanID)
    );
    PRINT 'Created POSTPAID table';
END
GO

-- =============================================
-- Table: PREPAID (extends PLAN)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PREPAID')
BEGIN
    CREATE TABLE PREPAID (
        PlanID INT PRIMARY KEY,
        Cost DECIMAL(10,2) NOT NULL,
        ValidityDays INT NOT NULL,
        FOREIGN KEY (PlanID) REFERENCES [PLAN](PlanID)
    );
    PRINT 'Created PREPAID table';
END
GO

-- =============================================
-- Table: SUBSCRIPTION
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SUBSCRIPTION')
BEGIN
    CREATE TABLE SUBSCRIPTION (
        SubscriptionID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        PlanID INT NOT NULL,
        StartDate DATETIME NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'Active',
        FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID),
        FOREIGN KEY (PlanID) REFERENCES [PLAN](PlanID)
    );
    PRINT 'Created SUBSCRIPTION table';
END
GO

-- =============================================
-- Table: USAGE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'USAGE')
BEGIN
    CREATE TABLE [USAGE] (
        UsageID INT IDENTITY(1,1) PRIMARY KEY,
        SubscriptionID INT NOT NULL,
        StartDateTime DATETIME NOT NULL,
        StopDateTime DATETIME NOT NULL,
        DataUsed FLOAT NULL DEFAULT 0,
        MinutesUsed INT NULL DEFAULT 0,
        SMSUsed INT NULL DEFAULT 0,
        FOREIGN KEY (SubscriptionID) REFERENCES SUBSCRIPTION(SubscriptionID)
    );
    PRINT 'Created USAGE table';
END
GO

-- =============================================
-- Table: BILL
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BILL')
BEGIN
    CREATE TABLE BILL (
        BillID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        SubscriptionID INT NOT NULL,
        BillingMonth DATE NOT NULL,
        TotalAmount DECIMAL(10,2) NOT NULL,
        OverageCharges DECIMAL(10,2) NULL DEFAULT 0,
        DueDate DATE NOT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        GeneratedDate DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID),
        FOREIGN KEY (SubscriptionID) REFERENCES SUBSCRIPTION(SubscriptionID)
    );
    PRINT 'Created BILL table';
END
GO

PRINT 'All tables created successfully!';
GO
